const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order'); // Thêm Order model
const aboutController = require('../controllers/aboutController');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const orderController = require('../controllers/orderController');
const productController = require('../controllers/productController');
<<<<<<< HEAD
const { protect, admin, isAuth } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
=======
const { protect, admin, isAuth, authorize } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const contactController = require('../controllers/contactController');
>>>>>>> 426465bb2903856af9056c99a1a6e192cacd2815

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
<<<<<<< HEAD
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
=======
router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof orderController.getAdminDashboard === 'function') {
      orderController.getAdminDashboard(req, res);
    } else {
      res.render('admin/dashboard', {
        title: 'Bảng điều khiển',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang bảng điều khiển',
      user: req.session.user
    });
  }
});

// Admin Product Routes
router.get('/admin/products', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof productController.getAdminProducts === 'function') {
      productController.getAdminProducts(req, res);
    } else {
      res.render('admin/products', {
        title: 'Quản lý sản phẩm',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang quản lý sản phẩm',
      user: req.session.user
    });
  }
});

router.get('/admin/products/add', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof productController.getAddProductPage === 'function') {
      productController.getAddProductPage(req, res);
    } else {
      res.render('admin/add-product', {
        title: 'Thêm sản phẩm mới',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang thêm sản phẩm',
      user: req.session.user
    });
  }
});

router.get('/admin/products/edit/:id', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof productController.getEditProductPage === 'function') {
      productController.getEditProductPage(req, res);
    } else {
      const { id } = req.params;
      // Tìm sản phẩm theo ID
      Product.findById(id)
        .then(product => {
          if (!product) {
            return res.status(404).render('error', {
              title: 'Không tìm thấy',
              message: 'Không tìm thấy sản phẩm',
              user: req.session.user
            });
          }
          
          // Lấy danh sách danh mục
          Category.find().sort({ name: 1 })
            .then(categories => {
              res.render('admin/edit-product', {
                title: 'Chỉnh sửa sản phẩm',
                product,
                categories,
                user: req.session.user
              });
            });
        })
        .catch(error => {
          console.error('Error finding product:', error);
          res.status(500).render('error', {
            title: 'Lỗi Server',
            message: 'Lỗi khi tìm sản phẩm',
            user: req.session.user
          });
        });
    }
  } catch (error) {
    console.error('Edit product error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang chỉnh sửa sản phẩm',
      user: req.session.user
    });
  }
});

// Admin Order Routes - Sử dụng try-catch để bắt lỗi
router.get('/admin/orders', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof orderController.getAdminOrders === 'function') {
      orderController.getAdminOrders(req, res);
    } else {
      res.render('admin/orders', {
        title: 'Quản lý đơn hàng',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang quản lý đơn hàng',
      user: req.session.user
    });
  }
});

router.get('/admin/orders/:id', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof orderController.getOrderDetails === 'function') {
      orderController.getOrderDetails(req, res);
    } else {
      res.render('admin/order-detail', {
        title: 'Chi tiết đơn hàng',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang chi tiết đơn hàng',
      user: req.session.user
    });
  }
});

// Admin User Management Routes
router.get('/admin/users', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof userController.getAdminUsers === 'function') {
      userController.getAdminUsers(req, res);
    } else {
      res.render('admin/users', {
        title: 'Quản lý người dùng',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang quản lý người dùng',
      user: req.session.user
    });
  }
});

router.get('/admin/users/:id', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof userController.getAdminUserDetail === 'function') {
      userController.getAdminUserDetail(req, res);
    } else {
      res.render('admin/user-detail', {
        title: 'Chi tiết người dùng',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang chi tiết người dùng',
      user: req.session.user
    });
  }
});

// Admin Contact Management Routes
router.get('/admin/contacts', protect, authorize('admin'), (req, res) => {
  try {
    // Gọi controller method nếu tồn tại, hoặc sử dụng phương thức mặc định
    if (typeof contactController.getContactsPage === 'function') {
      contactController.getContactsPage(req, res);
    } else {
      res.render('admin/contacts', {
        title: 'Quản lý liên hệ',
        user: req.session.user
      });
    }
  } catch (error) {
    console.error('Contacts page error:', error);
    res.status(500).render('error', { 
      title: 'Lỗi Server',
      message: 'Lỗi khi tải trang quản lý liên hệ',
      user: req.session.user
    });
  }
});
>>>>>>> 426465bb2903856af9056c99a1a6e192cacd2815

module.exports = router;
