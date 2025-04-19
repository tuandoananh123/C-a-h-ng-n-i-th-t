const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

// Load environment variables
dotenv.config();

// Define MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure session store
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
  expires: 1000 * 60 * 60 * 24 * 7, // 1 week
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000
  }
});

store.on('error', function (error) {
  console.log('Session store error:', error);
  // Sử dụng bộ nhớ tạm thời nếu không thể kết nối đến MongoDB
  console.log('Falling back to in-memory session store');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình đường dẫn uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// File upload middleware
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true,
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET || 'household-goods-secret-key',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
  store: store,
  resave: false,
  saveUninitialized: false
}));

// Middleware để debug session
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const viewRoutes = require('./routes/viewRoutes');
const orderRoutes = require('./routes/orderRoutes');

// API routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// ✅ Sử dụng route đơn hàng
app.use('/', orderRoutes);

// Thêm trang chỉnh sửa hồ sơ
app.get('/profile-edit', (req, res) => {
  if (!req.session.user) {
    console.log('User not logged in, redirecting to login page');
    return res.redirect('/login');
  }

  console.log('Rendering profile-edit page with user:', req.session.user);

  res.render('profile-edit', {
    title: 'Chỉnh sửa thông tin cá nhân',
    user: req.session.user
  });
});

// User routes - Các trang quản lý tài khoản và đơn hàng
app.use('/user', userRoutes);

// View routes - Trang giao diện người dùng
app.use('/', viewRoutes);

// Thêm routes chuyển hướng
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.redirect('/user/profile');
});

// Xử lý cổng bị chiếm dụng và khởi động server
let currentPort = PORT;

// Kết nối MongoDB và khởi động server
mongoose.connect(MONGODB_URI)
  .then(conn => {
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);

    // Khởi tạo các danh mục mặc định
    initDefaultCategories();

    // Khởi động server
    startServer();
  })
  .catch(err => {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

function startServer() {
  const server = app.listen(currentPort)
    .on('listening', () => {
      console.log(`Server đang chạy trên cổng ${currentPort}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Cổng ${currentPort} đã được sử dụng, thử cổng ${++currentPort}`);
        startServer();
      } else {
        console.error('Lỗi khởi động server:', err);
      }
    });
}

// Hàm khởi tạo danh mục mặc định
async function initDefaultCategories() {
  try {
    const Category = require('./models/Category');
    const defaultCategories = [
      { name: 'Nhà bếp', description: 'Các sản phẩm dùng trong nhà bếp', slug: 'nha-bep' },
      { name: 'Phòng ngủ', description: 'Các sản phẩm dùng trong phòng ngủ', slug: 'phong-ngu' },
      { name: 'Phòng tắm', description: 'Các sản phẩm dùng trong phòng tắm', slug: 'phong-tam' },
      { name: 'Phòng khách', description: 'Các sản phẩm dùng trong phòng khách', slug: 'phong-khach' },
      { name: 'Đồ điện tử', description: 'Các sản phẩm điện tử gia dụng', slug: 'do-dien-tu' },
      { name: 'Đồ nội thất', description: 'Các sản phẩm nội thất trong nhà', slug: 'do-noi-that' }
    ];

    for (const category of defaultCategories) {
      // Kiểm tra xem danh mục đã tồn tại chưa
      const existingCategory = await Category.findOne({ name: category.name });
      if (!existingCategory) {
        await Category.create(category);
        console.log(`Đã tạo danh mục mặc định: ${category.name}`);
      }
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo danh mục mặc định:', error);
  }
}

module.exports = app;
