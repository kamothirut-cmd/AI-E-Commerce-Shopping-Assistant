const db = require('../config/db');

// @route   GET /api/products
// @desc    Get all products with searching, category filtering, price filtering, and sorting
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, inStock, sort } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    // Search filter (name or description)
    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    // Category filter (by id or slug)
    if (category) {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(parseInt(category, 10));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    // Price range filter
    if (minPrice !== undefined && minPrice !== '') {
      sql += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      sql += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    // In-stock only filter
    if (inStock === 'true' || inStock === true) {
      sql += ` AND p.stock > 0`;
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price-desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'rating-desc':
        sql += ` ORDER BY p.rating DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      default:
        sql += ` ORDER BY p.product_id ASC`;
    }

    const products = await db.allAsync(sql, params);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/products/:id
// @desc    Get product details by ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await db.getAsync(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/products (Admin)
// @desc    Create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const { name, category_id, description, price, stock, image_url, rating } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Product name and price are required' });
    }

    const defaultImg = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

    const result = await db.runAsync(
      `INSERT INTO products (name, category_id, description, price, stock, image_url, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category_id ? parseInt(category_id, 10) : null,
        description || '',
        parseFloat(price),
        stock !== undefined ? parseInt(stock, 10) : 0,
        image_url || defaultImg,
        rating !== undefined ? parseFloat(rating) : 4.5
      ]
    );

    const newProduct = await db.getAsync(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [result.lastID]);

    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/products/:id (Admin)
// @desc    Update an existing product
exports.updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const existing = await db.getAsync('SELECT * FROM products WHERE product_id = ?', [productId]);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, category_id, description, price, stock, image_url, rating } = req.body;

    await db.runAsync(
      `UPDATE products SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        stock = COALESCE(?, stock),
        image_url = COALESCE(?, image_url),
        rating = COALESCE(?, rating)
       WHERE product_id = ?`,
      [
        name !== undefined ? name.trim() : null,
        category_id !== undefined ? parseInt(category_id, 10) : null,
        description !== undefined ? description : null,
        price !== undefined ? parseFloat(price) : null,
        stock !== undefined ? parseInt(stock, 10) : null,
        image_url !== undefined ? image_url : null,
        rating !== undefined ? parseFloat(rating) : null,
        productId
      ]
    );

    const updated = await db.getAsync(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [productId]);

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/products/:id (Admin)
// @desc    Delete a product
exports.deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const existing = await db.getAsync('SELECT * FROM products WHERE product_id = ?', [productId]);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.runAsync('DELETE FROM products WHERE product_id = ?', [productId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};
