const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order'); // Thêm Order model
const aboutController = require('../controllers/aboutController');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const orderController = require('../controllers/orderController');
const productController = require('../controllers/productController');
const { protect, admin, isAuth } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// Middleware kiểm tra đăng nhập
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Home page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Household Goods Store',
    user: req.session.user || null
  });
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Đăng ký tài khoản',
    user: req.session.user || null
  });
});

// Login page
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Đăng nhập',
    user: req.session.user || null
  });
});

// Products page
router.get('/products', async (req, res) => {
  try {
    const productsPerPage = 10;
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category;

    // Xây dựng query để lọc sản phẩm
    let query = {};

    // Lấy danh sách các danh mục để hiển thị trong bộ lọc
    const categories = await Category.find().sort({ name: 1 });

    // Nếu có tham số category và không phải là "Tất cả sản phẩm"
    if (category && category !== 'all') {
      // Kiểm tra xem category có phải là ObjectId hợp lệ không
      if (mongoose.Types.ObjectId.isValid(category)) {
        // Tìm theo category ID
        const categoryObj = await Category.findById(category);
        if (categoryObj) {
          query.category = categoryObj.name; // Lọc theo tên danh mục
        }
      } else {
        // Nếu không phải ObjectId, giả định là tên danh mục
        query.category = category;
      }
    }

    // Thêm lọc theo tìm kiếm nếu có
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Thêm lọc theo giá nếu có
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Đếm tổng số sản phẩm thỏa mãn điều kiện
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    // Xác định cách sắp xếp
    let sortOption = {};
    if (req.query.sort === 'price-asc') sortOption.price = 1;
    else if (req.query.sort === 'price-desc') sortOption.price = -1;
    else if (req.query.sort === 'name-asc') sortOption.name = 1;
    else if (req.query.sort === 'name-desc') sortOption.name = -1;
    else sortOption.createdAt = -1; // Mặc định: mới nhất

    // Lấy danh sách sản phẩm
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * productsPerPage)
      .limit(productsPerPage);

    // Gán danh mục cho từng sản phẩm
    const enhancedProducts = products.map(product => {
      const productObj = product.toObject();

      // Tìm danh mục trong danh sách categories đã lấy
      const matchedCategory = categories.find(cat => cat.name === product.category);

      productObj.categoryInfo = matchedCategory || { name: product.category || "Chưa phân loại" };
      return productObj;
    });

    res.render('products', {
      title: category ? `Sản phẩm - ${category}` : 'Tất cả sản phẩm',
      user: req.session.user || null,
      query: req.query,
      products: enhancedProducts,
      categories, // Truyền danh sách danh mục vào view
      totalPages,
      currentPage: page,
      paginationUrl: Object.entries(req.query)
        .filter(([key]) => key !== 'page')
        .map(([key, value]) => `${key}=${value}`)
        .join('&') + '&',

    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Có lỗi xảy ra khi lấy danh sách sản phẩm.');
  }
});

// Product detail page
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', {
        title: 'Không tìm thấy sản phẩm',
        message: 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.',
        user: req.session.user || null
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.render('product-detail', {
      title: product.name,
      product,
      productId: req.params.id,
      relatedProducts,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải thông tin sản phẩm.',
      user: req.session.user || null
    });
  }
});

// Cart page
router.get('/cart', checkAuth, (req, res) => {
  res.render('cart', {
    title: 'Giỏ hàng',
    user: req.session.user || null
  });
});

// Checkout page
router.get('/checkout', checkAuth, (req, res) => {
  res.render('checkout', {
    title: 'Thanh toán',
    user: req.session.user || null
  });
});

// About page
router.get('/about', async (req, res) => {
  try {
    const aboutData = await aboutController.getAboutData();
    console.log('About data received in route:', aboutData);

    res.render('about', {
      title: aboutData ? aboutData.title : 'Về chúng tôi',
      aboutData,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error fetching about data:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải thông tin về công ty.',
      user: req.session.user || null
    });
  }
});

// Profile page với orders
router.get('/profile', checkAuth, async (req, res) => {
  try {
    // Lấy danh sách đơn hàng của user
    const orders = await Order.find({ user: req.session.user._id })
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian mới nhất

    res.render('profile', {
      title: 'Tài khoản',
      user: req.session.user,
      orders: orders // Truyền orders vào view
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.render('profile', {
      title: 'Tài khoản',
      user: req.session.user,
      orders: [] // Trường hợp lỗi, truyền mảng rỗng
    });
  }
});

// Admin Routes
router.get('/admin', protect, admin, (req, res) => {
  res.redirect('/admin/dashboard');
});
router.get('/admin/dashboard', protect, admin, orderController.getAdminDashboard);

// Admin Product Routes
router.get('/admin/products', protect, admin, productController.getAdminProducts);
router.post('/admin/products', protect, admin, productController.createProduct);
router.post('/admin/products/update', protect, admin, productController.updateProduct);
router.post('/admin/products/delete', protect, admin, productController.deleteProduct);

// Admin Order Routes
router.get('/admin/orders', protect, admin, orderController.getAdminOrders);
router.get('/admin/orders/:id', protect, admin, orderController.getAdminOrderDetail);
router.post('/admin/orders/update-status', protect, admin, orderController.updateOrderStatus);

// Admin User Management Routes
router.get('/admin/users', protect, admin, userController.getAdminUsers);
router.get('/admin/users/:id', protect, admin, userController.getAdminUserDetail);
router.post('/admin/users/:id/update', protect, admin, userController.updateUser);
router.post('/admin/users/delete', protect, admin, userController.deleteUser);

module.exports = router;
