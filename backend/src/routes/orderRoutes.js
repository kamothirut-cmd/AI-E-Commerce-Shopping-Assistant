const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

// User endpoints
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

// Admin-only endpoints
router.get('/', requireAdmin, orderController.getAllOrders);

// Order status update (Admin or Order Owner for demo/tracking simulation)
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
