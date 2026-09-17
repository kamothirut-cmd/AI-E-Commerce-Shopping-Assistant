const db = require('../config/db');

// @route   GET /api/cart
// @desc    Get user's current shopping cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const items = await db.allAsync(`
      SELECT 
        c.cart_id,
        c.quantity,
        p.product_id,
        p.name,
        p.price,
        p.stock,
        p.image_url,
        cat.name as category_name,
        (c.quantity * p.price) as item_total
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN categories cat ON p.category_id = cat.category_id
      WHERE c.user_id = ?
      ORDER BY c.cart_id DESC
    `, [userId]);

    const subtotal = items.reduce((acc, item) => acc + item.item_total, 0);
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    res.json({
      items,
      totalItems,
      subtotal: parseFloat(subtotal.toFixed(2))
    });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/cart
// @desc    Add product to cart or increment quantity
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required' });
    }

    const qty = parseInt(quantity, 10) || 1;
    if (qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check product exists and stock
    const product = await db.getAsync('SELECT * FROM products WHERE product_id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ message: 'Sorry, this product is currently out of stock.' });
    }

    // Check existing item in cart
    const existing = await db.getAsync(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          message: `Cannot add more. Only ${product.stock} items available in stock (You already have ${existing.quantity} in cart).`
        });
      }

      await db.runAsync(
        'UPDATE cart SET quantity = ? WHERE cart_id = ?',
        [newQty, existing.cart_id]
      );
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          message: `Cannot add ${qty} items. Only ${product.stock} available in stock.`
        });
      }

      await db.runAsync(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, qty]
      );
    }

    // Return updated cart
    exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/cart/:productId
// @desc    Update quantity of an item in cart
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty)) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    if (newQty <= 0) {
      // Remove item if quantity is zero or negative
      await db.runAsync('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
      return exports.getCart(req, res, next);
    }

    // Check stock
    const product = await db.getAsync('SELECT stock FROM products WHERE product_id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (newQty > product.stock) {
      return res.status(400).json({
        message: `Requested quantity exceeds available stock (${product.stock} units available).`
      });
    }

    await db.runAsync(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [newQty, userId, productId]
    );

    exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/cart/:productId
// @desc    Remove an item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const productId = req.params.productId;

    await db.runAsync('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
    exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/cart
// @desc    Clear entire cart
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    await db.runAsync('DELETE FROM cart WHERE user_id = ?', [userId]);
    res.json({ message: 'Cart cleared successfully', items: [], totalItems: 0, subtotal: 0 });
  } catch (err) {
    next(err);
  }
};
