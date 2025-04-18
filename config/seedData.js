const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { connectDB } = require('./dbConnection');

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Sample data
const categories = [
  {
    name: 'Đồ dùng nhà bếp',
    description: 'Các sản phẩm dùng trong nhà bếp',
    slug: 'do-dung-nha-bep'
  },
  {
    name: 'Đồ dùng phòng ngủ',
    description: 'Các sản phẩm dùng trong phòng ngủ',
    slug: 'do-dung-phong-ngu'
  },
  {
    name: 'Đồ dùng phòng tắm',
    description: 'Các sản phẩm dùng trong phòng tắm',
    slug: 'do-dung-phong-tam'
  },
  {
    name: 'Đồ dùng phòng khách',
    description: 'Các sản phẩm dùng trong phòng khách',
    slug: 'do-dung-phong-khach'
  }
];

const products = [
  {
    name: 'Nồi cơm điện',
    description: 'Nồi cơm điện cao cấp, dung tích 1.8L',
    price: 1200000,
    stock: 50,
    images: ['noi-com-dien-1.jpg', 'noi-com-dien-2.jpg'],
    category: 'Đồ dùng nhà bếp',
    featured: true
  },
  {
    name: 'Bộ chăn ga gối',
    description: 'Bộ chăn ga gối cotton 100%, kích thước 1m8',
    price: 1500000,
    stock: 30,
    images: ['chan-ga-goi-1.jpg', 'chan-ga-goi-2.jpg'],
    category: 'Đồ dùng phòng ngủ',
    featured: true
  },
  {
    name: 'Bộ vòi sen',
    description: 'Bộ vòi sen cao cấp, tiết kiệm nước',
    price: 800000,
    stock: 40,
    images: ['voi-sen-1.jpg', 'voi-sen-2.jpg'],
    category: 'Đồ dùng phòng tắm',
    featured: false
  },
  {
    name: 'Bàn trà',
    description: 'Bàn trà gỗ cao cấp, kích thước 80x120cm',
    price: 2500000,
    stock: 20,
    images: ['ban-tra-1.jpg', 'ban-tra-2.jpg'],
    category: 'Đồ dùng phòng khách',
    featured: true
  },
  {
    name: 'Máy xay sinh tố',
    description: 'Máy xay sinh tố công suất cao, dung tích 1.5L',
    price: 900000,
    stock: 35,
    images: ['may-xay-sinh-to-1.jpg', 'may-xay-sinh-to-2.jpg'],
    category: 'Đồ dùng nhà bếp',
    featured: false
  },
  {
    name: 'Đèn ngủ',
    description: 'Đèn ngủ LED tiết kiệm điện',
    price: 350000,
    stock: 60,
    images: ['den-ngu-1.jpg', 'den-ngu-2.jpg'],
    category: 'Đồ dùng phòng ngủ',
    featured: false
  }
];

const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    phoneNumber: '0123456789',
    address: {
      street: '123 Đường Admin',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé'
    },
    role: 'admin'
  },
  {
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    password: 'user123',
    phoneNumber: '0987654321',
    address: {
      street: '456 Đường User',
      city: 'Hồ Chí Minh',
      district: 'Quận 2',
      ward: 'Phường An Phú'
    },
    role: 'user'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    
    console.log('Đã xóa dữ liệu cũ');
    
    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Đã tạo ${createdCategories.length} danh mục`);
    
    // Create products with category references
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    const productsWithCategoryIds = products.map(product => ({
      ...product,
      category: categoryMap[product.category]
    }));
    
    const createdProducts = await Product.insertMany(productsWithCategoryIds);
    console.log(`Đã tạo ${createdProducts.length} sản phẩm`);
    
    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      users.map(async user => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword,
          address: {
            ...user.address,
            fullAddress: `${user.address.street}, ${user.address.ward}, ${user.address.district}, ${user.address.city}`
          }
        };
      })
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Đã tạo ${createdUsers.length} người dùng`);
    
    console.log('Khởi tạo dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khởi tạo dữ liệu:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
