const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All checkout routes are protected - require authentication
router.use(protect);

// Order routes for users
router.post('/', orderController.createOrder);
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/cancel', orderController.cancelOrder);

// Admin routes for order management
router.get('/admin/orders', protect, admin, orderController.getAllOrders);
router.put('/admin/orders/:id', protect, admin, orderController.updateOrderStatus);

module.exports = router;
