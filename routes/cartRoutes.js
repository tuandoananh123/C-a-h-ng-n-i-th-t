const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

// All cart routes are protected - require authentication
router.use(protect);

// Cart routes
router.get('/', cartController.getCart);
router.post('/add', cartController.addItemToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/item/:itemId', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;
