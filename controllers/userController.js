const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'household-goods-jwt-secret', {
    expiresIn: '30d'
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    console.log('Đang cố gắng đăng ký người dùng:', req.body);
    const { firstName, lastName, email, password, phoneNumber, address } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Email đã tồn tại:', email);
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({
          success: false,
          error: 'Email đã được sử dụng'
        });
      } else {
        return res.render('register', {
          title: 'Đăng ký',
          error: 'Email đã được sử dụng',
          user: null,
          formData: req.body
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address
    });

    // Generate token
    const token = generateToken(user._id);

    // Set user session
    req.session.user = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role
    };

    console.log('Đăng ký thành công, tạo session user:', req.session.user);

    // Respond based on request type
    if (req.headers['content-type'] === 'application/json') {
      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        user: req.session.user
      });
    } else {
      // Redirect to profile
      return res.redirect('/profile');
    }
  } catch (error) {
    console.error('Lỗi khi đăng ký người dùng:', error);
    
    // Mongoose validation error
    let errorMessage = 'Có lỗi xảy ra khi đăng ký';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
    }
    
    if (req.headers['content-type'] === 'application/json') {
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    } else {
      return res.render('register', {
        title: 'Đăng ký',
        error: errorMessage,
        user: null,
        formData: req.body
      });
    }
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Đang cố gắng đăng nhập:', email);

    // Check for email and password
    if (!email || !password) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp email và mật khẩu'
        });
      } else {
        return res.render('login', {
          title: 'Đăng nhập',
          error: 'Vui lòng cung cấp email và mật khẩu',
          user: null
        });
      }
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Không tìm thấy người dùng với email:', email);
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        });
      } else {
        return res.render('login', {
          title: 'Đăng nhập',
          error: 'Email hoặc mật khẩu không đúng',
          user: null
        });
      }
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Mật khẩu không khớp cho user:', email);
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        });
      } else {
        return res.render('login', {
          title: 'Đăng nhập',
          error: 'Email hoặc mật khẩu không đúng',
          user: null
        });
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Set user session
    req.session.user = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role
    };

    console.log('Đăng nhập thành công, tạo session user:', req.session.user);

    // Respond based on request type
    if (req.headers['content-type'] === 'application/json') {
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        user: req.session.user
      });
    } else {
      // Redirect to profile or homepage
      return res.redirect('/profile');
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({
        success: false,
        error: 'Có lỗi xảy ra khi đăng nhập'
      });
    } else {
      return res.render('login', {
        title: 'Đăng nhập',
        error: 'Có lỗi xảy ra khi đăng nhập',
        user: null
      });
    }
  }
};

// Logout user
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Lỗi khi đăng xuất:', err);
      return res.redirect('/');
    }
    
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    console.log('Getting user profile with ID:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }
    
    console.log('User data:', {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || 'Chưa cung cấp',
      address: user.address || 'Chưa cung cấp'
    });
    
    // Render profile page with user data
    res.render('profile', {
      title: 'Tài khoản',
      user: user,
      orders: [] // Bạn có thể thêm orders nếu cần
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).render('error', {
      message: 'Đã xảy ra lỗi khi tải thông tin người dùng',
      error: process.env.NODE_ENV === 'development' ? error : {},
      title: 'Lỗi',
      user: req.session.user
    });
  }
};

// Get edit profile page
exports.getEditProfilePage = async (req, res) => {
  try {
    // Lấy thông tin người dùng từ database
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy người dùng',
        title: 'Lỗi',
        user: req.session.user
      });
    }
    
    console.log('Rendering profile-edit page with user data:', {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || 'Chưa cung cấp',
      address: user.address || 'Chưa cung cấp'
    });
    
    // Render trang chỉnh sửa thông tin
    res.render('profile-edit', {
      title: 'Chỉnh sửa thông tin',
      user: user
    });
  } catch (error) {
    console.error('Error loading edit profile page:', error);
    res.status(500).render('error', {
      message: 'Đã xảy ra lỗi khi tải trang chỉnh sửa',
      error: process.env.NODE_ENV === 'development' ? error : {},
      title: 'Lỗi',
      user: req.session.user
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('Cập nhật thông tin người dùng với dữ liệu:', req.body);
    console.log('User trong request:', req.user);
    
    let userId = req.user._id || req.session.user._id;
    console.log('User ID được sử dụng:', userId);
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('Không tìm thấy user với ID:', userId);
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }
    
    // Update user fields
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.address = req.body.address || user.address;
    
    console.log('Thông tin cập nhật:', {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address
    });
    
    // Check and update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    // Update session
    req.session.user = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      address: updatedUser.address,
      role: updatedUser.role
    };
    
    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Admin: Get all users
exports.getAdminUsers = async (req, res) => {
  try {
    // Lấy tất cả người dùng, không bao gồm mật khẩu
    const users = await User.find().select('-password');
    
    res.render('admin/users', {
      title: 'Quản Trị - Người Dùng',
      users,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải danh sách người dùng',
      error,
      user: req.session.user || null
    });
  }
};

// Admin: Get user details
exports.getAdminUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Tìm thông tin người dùng theo ID, không bao gồm mật khẩu
    const userData = await User.findById(userId).select('-password');
    
    if (!userData) {
      return res.status(404).render('error', {
        title: 'Không tìm thấy',
        message: 'Không tìm thấy thông tin người dùng',
        user: req.session.user || null
      });
    }
    
    // Tìm danh sách đơn hàng của người dùng
    const userOrders = await Order.find({ user: userId }).sort({ orderDate: -1 });
    
    res.render('admin/user-detail', {
      title: 'Chi tiết người dùng',
      userData,
      userOrders,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải thông tin người dùng',
      error,
      user: req.session.user || null
    });
  }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, isAdmin } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }
    
    // Kiểm tra email đã tồn tại chưa (trừ email của người dùng hiện tại)
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi người dùng khác'
      });
    }
    
    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name, 
        email, 
        isAdmin: isAdmin === 'true' || isAdmin === true
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật thông tin người dùng thành công'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin người dùng'
    });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra xem người dùng có đơn hàng không
    const userOrders = await Order.countDocuments({ user: userId });
    if (userOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa người dùng này vì họ có đơn hàng trong hệ thống'
      });
    }
    
    // Xóa giỏ hàng của người dùng
    await Cart.findOneAndDelete({ user: userId });
    
    // Xóa người dùng
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa người dùng'
    });
  }
};
