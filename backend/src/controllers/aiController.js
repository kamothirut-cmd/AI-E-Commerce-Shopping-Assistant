const db = require('../config/db');

// Intelligent local semantic matcher when external API is not configured or fails
function localRecommendProducts(message, products) {
  const lowerMsg = message.toLowerCase().replace(/,/g, '');

  // Extract budget mentions in INR: e.g. "under 50000", "under ₹20000", "under 10k", "under 1.5 lakh"
  let maxBudget = null;
  let minBudget = null;

  const underMatch = lowerMsg.match(/(?:under|below|less than|within|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|lakh|l)?/i);
  if (underMatch) {
    let val = parseFloat(underMatch[1]);
    const unit = (underMatch[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    else if (unit === 'lakh' || unit === 'l') val *= 100000;
    maxBudget = val;
  }

  const aboveMatch = lowerMsg.match(/(?:above|more than|at least|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|lakh|l)?/i);
  if (aboveMatch) {
    let val = parseFloat(aboveMatch[1]);
    const unit = (aboveMatch[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    else if (unit === 'lakh' || unit === 'l') val *= 100000;
    minBudget = val;
  }

  // Tokenize keywords
  const tokens = lowerMsg
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'need', 'want', 'show', 'looking', 'recommend', 'suggest', 'best', 'good', 'some', 'rupees', 'inr'].includes(t));

  // Score products
  const scored = products.map(prod => {
    let score = 0;
    const nameLower = prod.name.toLowerCase();
    const descLower = (prod.description || '').toLowerCase();
    const catLower = (prod.category_name || '').toLowerCase();

    // Budget check
    if (maxBudget !== null) {
      if (prod.price <= maxBudget) {
        score += 8;
      } else {
        score -= 15; // Penalize over budget
      }
    }
    if (minBudget !== null) {
      if (prod.price >= minBudget) {
        score += 3;
      } else {
        score -= 6;
      }
    }

    // Token matching
    for (const token of tokens) {
      if (nameLower.includes(token)) score += 8;
      if (catLower.includes(token)) score += 6;
      if (descLower.includes(token)) score += 3;
    }

    // Keyword intent mapping
    if (lowerMsg.includes('game') || lowerMsg.includes('gaming')) {
      if (nameLower.includes('predator') || catLower.includes('gaming') || descLower.includes('rtx') || descLower.includes('fps')) score += 10;
    }
    if (lowerMsg.includes('work') || lowerMsg.includes('office') || lowerMsg.includes('business') || lowerMsg.includes('study') || lowerMsg.includes('code') || lowerMsg.includes('coding')) {
      if (nameLower.includes('zenith') || nameLower.includes('titanbook') || catLower.includes('laptops')) score += 8;
    }
    if (lowerMsg.includes('music') || lowerMsg.includes('audio') || lowerMsg.includes('sound') || lowerMsg.includes('listen') || lowerMsg.includes('earbud') || lowerMsg.includes('headphone')) {
      if (catLower.includes('audio') || descLower.includes('sound') || descLower.includes('anc')) score += 9;
    }
    if (lowerMsg.includes('health') || lowerMsg.includes('fitness') || lowerMsg.includes('running') || lowerMsg.includes('workout') || lowerMsg.includes('watch')) {
      if (nameLower.includes('pulse') || nameLower.includes('watch') || catLower.includes('wearables')) score += 9;
    }
    if (lowerMsg.includes('cheap') || lowerMsg.includes('affordable') || lowerMsg.includes('budget')) {
      if (prod.price < 10000) score += 6;
    }

    // Stock boost
    if (prod.stock > 0) score += 2;
    else score -= 8;

    return { product: prod, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Take top 3-4 matches with positive score, or fallback to top rated items
  let topMatches = scored.filter(s => s.score > 0).slice(0, 4).map(s => s.product);

  if (topMatches.length === 0) {
    topMatches = products.slice(0, 3);
  }

  // Generate recommendation reasons
  const recommendations = topMatches.map(p => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    rating: p.rating,
    image_url: p.image_url,
    category_name: p.category_name,
    reason: generateReason(p, lowerMsg)
  }));

  let replyText = `I've analyzed our Indian catalog for you! Based on your request ("${message}"), here are my top recommended picks:`;
  if (maxBudget) {
    replyText += ` Each selection is tailored to match your budget target of under ₹${Number(maxBudget).toLocaleString('en-IN')}.`;
  }

  return {
    reply: replyText,
    recommendations
  };
}

function generateReason(product, query) {
  if (product.category_slug === 'laptops-computers') {
    return `Excellent processing power and display fidelity, perfectly matching your computing requirements.`;
  } else if (product.category_slug === 'audio-sound') {
    return `Features crisp acoustics and stellar battery performance for daily music and calls.`;
  } else if (product.category_slug === 'gaming-accessories') {
    return `High precision build designed for responsiveness, durability, and comfort.`;
  } else if (product.category_slug === 'smartphones-wearables') {
    return `Great wearable technology with comprehensive tracking sensors and battery endurance.`;
  }
  return `Highly rated by customers (${product.rating}★) and currently ready for immediate dispatch.`;
}

// Main AI Chat Assistant endpoint
exports.chatWithAssistant = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Fetch all current products with category info
    const products = await db.allAsync(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.rating DESC
    `);

    // Check if Gemini API key or OpenAI key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      try {
        const catalogBrief = products.map(p => ({
          id: p.product_id,
          name: p.name,
          category: p.category_name,
          price: p.price,
          stock: p.stock,
          rating: p.rating,
          description: p.description
        }));

        const systemPrompt = `You are a helpful, enthusiastic AI Shopping Assistant for our modern electronics and gadgets e-commerce store.
Here is our current store catalog in JSON:
${JSON.stringify(catalogBrief)}

User question: "${message}"

Respond strictly in JSON format with two keys:
1. "reply": A friendly, helpful conversational response explaining your suggestions (can use markdown formatting).
2. "recommendations": An array of recommended product IDs from our catalog that best match the query (e.g. [1, 4]). Do NOT recommend non-existent product IDs. Pick at most 3-4 products.

Response format:
{
  "reply": "your conversational response",
  "recommended_ids": [1, 2]
}`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const recIds = parsed.recommended_ids || [];
            const matchedProducts = products
              .filter(p => recIds.includes(p.product_id))
              .map(p => ({
                product_id: p.product_id,
                name: p.name,
                price: p.price,
                stock: p.stock,
                rating: p.rating,
                image_url: p.image_url,
                category_name: p.category_name,
                reason: generateReason(p, message)
              }));

            return res.json({
              reply: parsed.reply,
              recommendations: matchedProducts.length > 0 ? matchedProducts : localRecommendProducts(message, products).recommendations
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed or timed out, falling back to local recommendation engine:', geminiErr.message);
      }
    }

    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      try {
        const catalogBrief = products.map(p => ({
          id: p.product_id,
          name: p.name,
          category: p.category_name,
          price: p.price,
          stock: p.stock,
          rating: p.rating,
          description: p.description
        }));

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an AI Shopping Assistant for an e-commerce tech store. Here is the inventory: ${JSON.stringify(catalogBrief)}. Respond in JSON: {"reply": "...", "recommended_ids": [id1, id2]}`
              },
              { role: 'user', content: message }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          const recIds = parsed.recommended_ids || [];
          const matchedProducts = products
            .filter(p => recIds.includes(p.product_id))
            .map(p => ({
              product_id: p.product_id,
              name: p.name,
              price: p.price,
              stock: p.stock,
              rating: p.rating,
              image_url: p.image_url,
              category_name: p.category_name,
              reason: generateReason(p, message)
            }));

          return res.json({
            reply: parsed.reply,
            recommendations: matchedProducts.length > 0 ? matchedProducts : localRecommendProducts(message, products).recommendations
          });
        }
      } catch (openaiErr) {
        console.warn('OpenAI API call failed, falling back to local recommendation engine:', openaiErr.message);
      }
    }

    // Default intelligent local recommendation engine
    const localResult = localRecommendProducts(message, products);
    return res.json(localResult);
  } catch (err) {
    next(err);
  }
};
