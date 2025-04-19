const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    // Validate input
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp thông tin giao hàng và phương thức thanh toán'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Giỏ hàng trống'
      });
    }

    // Check product availability and create order items
    const orderItems = [];
    for (const item of cart.items) {
      try {
        // Kiểm tra item.product có tồn tại không
        if (!item.product || !item.product._id) {
          console.error('Sản phẩm không hợp lệ trong giỏ hàng:', item);
          continue; // Bỏ qua mục này và tiếp tục với mục tiếp theo
        }

        const product = await Product.findById(item.product._id);

        // Kiểm tra sản phẩm có tồn tại không
        if (!product) {
          console.error('Không tìm thấy sản phẩm:', item.product._id);
          continue; // Bỏ qua mục này và tiếp tục với mục tiếp theo
        }

        // Kiểm tra kho hàng - chú ý trường tên là stock không phải quantity
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Không đủ hàng trong kho: ${product.name} (Có: ${product.stock}, Yêu cầu: ${item.quantity})`
          });
        }

        // Thêm vào danh sách đơn hàng
        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          totalPrice: item.quantity * product.price
        });

        // Giảm số lượng sản phẩm trong kho
        product.stock -= item.quantity;
        // Sử dụng updateOne thay vì save() để tránh việc validate lại toàn bộ model
        await Product.updateOne(
          { _id: product._id },
          { $set: { stock: product.stock } }
        );
      } catch (itemError) {
        console.error('Lỗi xử lý mục đơn hàng:', itemError);
        // Bỏ qua mục này nếu có lỗi và tiếp tục với mục khác
      }
    }

    // Kiểm tra xem còn mục hàng nào không
    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Không thể tạo đơn hàng với giỏ hàng hiện tại. Vui lòng kiểm tra lại.'
      });
    }

    // Tính tổng tiền từ các mục đơn hàng đã được xác nhận
    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Tạo đơn hàng
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      orderStatus: 'processing'
    });

    // Xóa giỏ hàng sau khi đặt hàng thành công
    cart.items = [];
    cart.totalQuantity = 0;
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi tạo đơn hàng'
    });
  }
};

// Lấy danh sách đơn hàng của người dùng
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm tất cả đơn hàng của người dùng, sắp xếp theo thời gian tạo (mới nhất trước)
    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

    // Render trang danh sách đơn hàng
    res.render('user/orders', {
      title: 'Đơn hàng của tôi',
      user: req.session.user,
      orders
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      user: req.session.user,
      error: 'Không thể tải danh sách đơn hàng'
    });
  }
};

// Lấy chi tiết đơn hàng theo ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Kiểm tra người dùng đã đăng nhập chưa
    if (!req.session.user) {
      return res.redirect('/login?redirect=' + encodeURIComponent('/user/orders/' + orderId));
    }
    
    const userId = req.session.user._id;

    // Tìm đơn hàng theo ID - không cần filter theo user nếu là admin
    const query = { _id: orderId };
    if (req.session.user.role !== 'admin') {
      query.user = userId;
    }
    
    const order = await Order.findOne(query).populate('items.product');

    // Nếu không tìm thấy đơn hàng
    if (!order) {
      return res.status(404).render('error', {
        title: 'Không tìm thấy',
        user: req.session.user,
        message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này'
      });
    }

    // Chuẩn bị thông báo thành công nếu có
    const successMessage = req.query.success ? req.query.success : null;

    // Render trang chi tiết đơn hàng
    res.render('user/order-detail', {
      title: `Đơn hàng #${order._id.toString().slice(-8)}`,
      user: req.session.user,
      order,
      successMessage
    });
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      user: req.session.user,
      message: 'Không thể tải thông tin đơn hàng',
      error
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    // Only allow cancellation for processing orders
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Không thể hủy đơn hàng ở trạng thái này'
      });
    }

    // Update order status
    order.orderStatus = 'cancelled';
    await order.save();

    // Return items to inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .populate('user', 'firstName lastName email')
      .populate('items.product');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Admin: Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, status, paymentStatus, note, returnUrl } = req.body;
    
    // Tìm đơn hàng theo ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy đơn hàng',
        error: { status: 404 }
      });
    }
    
    // Cập nhật trạng thái đơn hàng và thanh toán
    order.orderStatus = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    
    // Cập nhật ngày cập nhật
    order.updatedAt = Date.now();
    
    await order.save();
    
    // Redirect đến trang chi tiết hoặc danh sách
    const redirect = returnUrl || '/admin/orders';
    res.redirect(`${redirect}?success=Đã cập nhật trạng thái đơn hàng thành công`);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng',
      error
    });
  }
};

// Admin: Hiển thị trang quản lý đơn hàng
exports.getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Lọc theo trạng thái nếu có
    const query = {};
    if (req.query.status && req.query.status !== '') {
      query.orderStatus = req.query.status;
    }
    
    // Đếm tổng số đơn hàng
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Lấy danh sách đơn hàng phân trang
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    
    res.render('admin/orders', {
      title: 'Quản Trị - Quản Lý Đơn Hàng',
      orders,
      currentPage: page,
      totalPages,
      message: req.query.success ? { type: 'success', text: req.query.success } : undefined,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi tải trang quản lý đơn hàng',
      error,
      user: req.session.user || null
    });
  }
};

// Admin: Hiển thị chi tiết đơn hàng
exports.getAdminOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm đơn hàng theo ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).render('error', {
        title: 'Lỗi',
        message: 'Không tìm thấy đơn hàng',
        error: { status: 404 },
        user: req.session.user || null
      });
    }
    
    // Tìm thông tin người dùng đặt hàng
    const user = await User.findById(order.user).select('-password');
    
    // Lấy hình ảnh cho mỗi sản phẩm trong đơn hàng
    const productImages = {};
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.images && product.images.length > 0) {
        productImages[item.product] = product.images[0];
      }
    }
    
    res.render('admin/order-detail', {
      title: `Quản Trị - Chi Tiết Đơn Hàng #${order._id.toString().substring(0, 8)}`,
      order,
      user,
      productImages,
      message: req.query.success ? { type: 'success', text: req.query.success } : undefined,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Admin order detail error:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi tải chi tiết đơn hàng',
      error,
      user: req.session.user || null
    });
  }
};

// Admin: Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    // Lấy tổng số sản phẩm
    const productCount = await Product.countDocuments();
    
    // Lấy tổng số đơn hàng
    const orderCount = await Order.countDocuments();
    
    // Lấy số đơn hàng mới (đang xử lý)
    const newOrderCount = await Order.countDocuments({ orderStatus: 'processing' });
    
    // Lấy các đơn hàng gần đây
    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Quản Trị - Dashboard',
      productCount,
      orderCount,
      newOrderCount,
      recentOrders,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải trang tổng quan',
      error,
      user: req.session.user || null
    });
  }
};
