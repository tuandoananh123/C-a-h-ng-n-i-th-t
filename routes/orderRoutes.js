const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');  // Thêm dòng này
const Order = require('../models/Order'); // Import model Order

// Middleware kiểm tra đăng nhập
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login?redirect=' + encodeURIComponent('/orders'));
  }
  next();
};

router.get('/orders/:id', orderController.getOrderById);
// ✅ Route hiển thị danh sách đơn hàng
router.get('/orders', checkAuth, async (req, res) => {
    try {
        // Lấy chỉ đơn hàng của người dùng đã đăng nhập
        const orders = await Order.find({ user: req.session.user._id }).sort({ orderDate: -1 });
        
        // Render với dữ liệu đơn hàng và thông tin người dùng
        res.render('user/order', { 
            orders,
            user: req.session.user, // Thêm thông tin người dùng từ session
            title: 'Đơn hàng của tôi'
        });
    } catch (err) {
        console.error('Lỗi khi lấy đơn hàng:', err);
        res.status(500).render('error', {
            title: 'Lỗi',
            user: req.session.user,
            message: 'Không thể tải danh sách đơn hàng'
        });
    }
});

module.exports = router; // ✅ Đảm bảo export router
