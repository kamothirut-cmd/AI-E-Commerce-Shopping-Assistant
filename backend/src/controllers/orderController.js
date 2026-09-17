const db = require('../config/db');

// @route   POST /api/orders
// @desc    Place a new order from current user cart with stock validation & decrement
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { shipping_address, payment_method = 'Credit Card', items: directItems } = req.body;

    if (!shipping_address || !shipping_address.trim()) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }

    // 1. Fetch user cart items from DB
    let cartItems = await db.allAsync(`
      SELECT 
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = ?
    `, [userId]);

    // Fallback: If DB cart is empty, use directItems payload (from guest cart sync or direct order placement)
    if ((!cartItems || cartItems.length === 0) && Array.isArray(directItems) && directItems.length > 0) {
      const validatedItems = [];
      for (const dItem of directItems) {
        const prod = await db.getAsync('SELECT product_id, name, price, stock FROM products WHERE product_id = ?', [dItem.product_id]);
        if (prod) {
          validatedItems.push({
            product_id: prod.product_id,
            quantity: Math.max(1, Number(dItem.quantity) || 1),
            name: prod.name,
            price: prod.price,
            stock: prod.stock
          });
        }
      }
      cartItems = validatedItems;
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty. Add products before checking out.' });
    }

    // 2. Stock Validation Check
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.name}". Only ${item.stock} unit(s) remaining in inventory.`
        });
      }
    }

    // 3. Calculate Subtotal, GST & Grand Total
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gst = Math.round(subtotal * 0.18);
    const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
    const grandTotal = Math.round(subtotal + gst + shipping);

    // 4. Create Order
    const orderResult = await db.runAsync(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [userId, grandTotal, shipping_address.trim(), payment_method]
    );

    const orderId = orderResult.lastID;

    // 5. Insert Order Items & Decrement Stock
    for (const item of cartItems) {
      await db.runAsync(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Decrement stock
      await db.runAsync(
        `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear User Cart in DB
    await db.runAsync('DELETE FROM cart WHERE user_id = ?', [userId]);

    // 7. Fetch complete order details
    const createdOrder = await db.getAsync('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    const items = await db.allAsync(`
      SELECT 
        oi.item_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name,
        p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Generate estimated delivery date (3 days from now)
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + 3);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        ...createdOrder,
        items,
        subtotal,
        gst,
        shipping,
        tracking_id: `BD-IND-${String(orderId).padStart(6, '0')}`,
        carrier: 'Blue Dart Express',
        estimated_delivery: estDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders/my-orders
// @desc    Get order history for logged-in user
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const orders = await db.allAsync(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Attach order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.allAsync(`
          SELECT 
            oi.item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.name,
            p.image_url
          FROM order_items oi
          JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = ?
        `, [order.order_id]);

        return {
          ...order,
          items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders/:id
// @desc    Get single order details by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    const order = await db.getAsync(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view this order.' });
    }

    const items = await db.allAsync(`
      SELECT 
        oi.item_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name,
        p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      ...order,
      items
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/orders (Admin)
// @desc    Get all orders across all users with filters
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` WHERE o.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const orders = await db.allAsync(sql, params);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.allAsync(`
          SELECT 
            oi.item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.name,
            p.image_url
          FROM order_items oi
          JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = ?
        `, [order.order_id]);

        return {
          ...order,
          items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/orders/:id/status (Admin)
// @desc    Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await db.getAsync('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && order.user_id === req.user.user_id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to update this order status.' });
    }

    await db.runAsync('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);

    const updated = await db.getAsync('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    res.json({
      message: `Order #${orderId} status updated to ${status}`,
      order: updated
    });
  } catch (err) {
    next(err);
  }
};
