const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Public routes - authentication
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Protected routes - profile management
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.get('/profile/edit', protect, userController.getEditProfilePage);

// Protected routes - orders management
router.get('/orders', protect, orderController.getUserOrders);
router.get('/orders/:id', protect, orderController.getOrderById);

module.exports = router;
