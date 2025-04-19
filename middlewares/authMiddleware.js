const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - check if user is authenticated
exports.protect = async (req, res, next) => {
  try {
    console.log('Middleware bảo vệ được gọi, kiểm tra session user:', req.session.user ? 'Có user' : 'Không có user');
    
    let token;
    
    // Check if token exists in Authorization header or in session
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.session && req.session.user) {
      // User is authenticated via session
      console.log('User đã đăng nhập qua session:', req.session.user.email);
      req.user = req.session.user;
      return next();
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Không có quyền truy cập, vui lòng đăng nhập'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'household-goods-jwt-secret');

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Không tìm thấy người dùng với token này'
      });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Không có quyền truy cập, vui lòng đăng nhập'
    });
  }
};

// Admin middleware - check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    req.flash('error', 'Không có quyền truy cập, chỉ dành cho quản trị viên');
    res.redirect('/');
  }
};

// Check if user is authenticated for views
exports.isAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }
  
  res.locals.user = null;
  next();
};
