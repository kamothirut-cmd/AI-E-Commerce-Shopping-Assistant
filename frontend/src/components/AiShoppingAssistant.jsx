import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  RotateCcw,
  Bot,
  User,
  Star,
  ArrowRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';

const INITIAL_PROMPTS = [
  'Best laptop for coding under ₹90,000',
  'Noise-cancelling wireless headphones under ₹15,000',
  'Esports gaming keyboard & mouse under ₹10,000',
  'Fitness smartwatch under ₹5,000',
  'Desk setup accessories under ₹3,000'
];

export default function AiShoppingAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 Namaste! I'm your AI Shopping Assistant. Tell me what tech you're shopping for, your budget in Rupees, or specific requirements, and I'll curate the top picks for you!",
      recommendations: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customMessage) => {
    const textToSend = customMessage || inputText;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend.trim() };
    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInputText('');
    setLoading(true);

    try {
      const data = await aiAPI.chatWithAssistant(textToSend.trim());
      const botMsg = {
        sender: 'assistant',
        text: data.reply || "Here are my recommended picks for you:",
        recommendations: data.recommendations || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I'm having a little trouble connecting to the recommendation catalog right now. Please try again in a moment.",
          recommendations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "Chat cleared. What tech products can I assist you with now?",
        recommendations: []
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Shopping Advisor</h3>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block'
                  }}
                  title="Online"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Catalog-Grounded Recommendations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleClearChat}
              className="btn btn-secondary btn-sm"
              title="Reset conversation"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="ai-drawer-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`ai-message ${msg.sender}`}>
              <div className={`ai-avatar ${msg.sender}`}>
                {msg.sender === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div style={{ maxWidth: '100%' }}>
                <div className="ai-bubble">
                  {msg.text}
                </div>

                {/* Render Product Recommendations if present */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {msg.recommendations.map((rec) => (
                      <div key={rec.product_id} className="ai-rec-card">
                        <img
                          src={rec.image_url}
                          alt={rec.name}
                          className="ai-rec-thumb"
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <h5
                              onClick={() => { onClose(); navigate(`/product/${rec.product_id}`); }}
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                cursor: 'pointer',
                                textDecoration: 'none'
                              }}
                              title="Click to view details"
                            >
                              {rec.name}
                            </h5>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-mint)' }}>
                              {formatINR(rec.price)}
                            </span>
                          </div>

                          {rec.reason && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.45rem', lineHeight: '1.4' }}>
                              💡 {rec.reason}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <button
                              onClick={() => { onClose(); navigate(`/product/${rec.product_id}`); }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
                            >
                              <span>Details</span>
                              <ExternalLink size={11} />
                            </button>
                            <button
                              onClick={() => addToCart(rec, 1)}
                              disabled={rec.stock <= 0}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
                            >
                              <Plus size={11} />
                              <span>{rec.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message assistant">
              <div className="ai-avatar assistant">
                <Bot size={18} />
              </div>
              <div className="ai-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Sparkles size={14} className="animate-spin" color="var(--accent-primary)" />
                <span>Searching catalog and tailoring recommendations in ₹...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Pills */}
        <div style={{ padding: '0.65rem 1.25rem 0.25rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 20, 34, 0.8)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Try asking (in Rupees):
          </div>
          <div className="prompt-pills" style={{ marginTop: 0, paddingBottom: '0.4rem' }}>
            {INITIAL_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="prompt-pill"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="ai-drawer-input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}
          >
            <input
              id="ai-chat-input"
              type="text"
              placeholder="Ask for recommendations (e.g., 'Laptop under ₹80,000')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="form-input"
              style={{ flex: 1, padding: '0.7rem 1rem' }}
            />
            <button
              id="ai-chat-send-btn"
              type="submit"
              disabled={!inputText.trim() || loading}
              className="btn btn-primary"
              style={{ padding: '0.7rem 1.1rem', opacity: (!inputText.trim() || loading) ? 0.6 : 1 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
