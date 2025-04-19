const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/dbConnection');

// Load environment variables
dotenv.config();

// Connect to MongoDB using the connection function
connectDB();

// Sample product data
const sampleProducts = [
  {
    name: 'Nồi cơm điện thông minh',
    description: 'Nồi cơm điện 1.8L với nhiều chế độ nấu thông minh, giữ ấm lên đến 12 giờ',
    price: 1500000,
    quantity: 20,
    imageUrl: '/images/product-1.jpg',
    category: 'Nhà bếp',
    featured: true
  },
  {
    name: 'Máy lọc không khí',
    description: 'Máy lọc không khí với bộ lọc HEPA, lọc bụi mịn, phấn hoa và khói thuốc',
    price: 3500000,
    quantity: 15,
    imageUrl: '/images/product-2.jpg',
    category: 'Đồ điện tử',
    featured: true
  },
  {
    name: 'Bộ chăn ga gối cotton',
    description: 'Bộ chăn ga gối làm từ 100% cotton, mềm mại và thoáng khí',
    price: 1200000,
    quantity: 30,
    imageUrl: '/images/product-3.jpg',
    category: 'Phòng ngủ',
    featured: true
  },
  {
    name: 'Bàn ăn 6 người',
    description: 'Bàn ăn gỗ cao cấp cho 6 người, thiết kế hiện đại',
    price: 5500000,
    quantity: 10,
    imageUrl: '/images/product-4.jpg',
    category: 'Đồ nội thất',
    featured: false
  },
  {
    name: 'Bộ dao nhà bếp',
    description: 'Bộ dao nhà bếp 5 món làm từ thép không gỉ',
    price: 800000,
    quantity: 25,
    imageUrl: '/images/product-5.jpg',
    category: 'Nhà bếp',
    featured: false
  },
  {
    name: 'Máy giặt tự động',
    description: 'Máy giặt 8kg với 10 chương trình giặt, tiết kiệm điện và nước',
    price: 6500000,
    quantity: 8,
    imageUrl: '/images/product-6.jpg',
    category: 'Đồ điện tử',
    featured: true
  },
  {
    name: 'Đèn ngủ LED',
    description: 'Đèn ngủ LED với 3 mức độ sáng, điều khiển từ xa',
    price: 450000,
    quantity: 40,
    imageUrl: '/images/product-7.jpg',
    category: 'Phòng ngủ',
    featured: false
  },
  {
    name: 'Sofa góc phòng khách',
    description: 'Sofa góc bọc da cao cấp, thiết kế hiện đại và sang trọng',
    price: 12000000,
    quantity: 5,
    imageUrl: '/images/product-8.jpg',
    category: 'Phòng khách',
    featured: true
  }
];

// Delete existing products and insert sample products
const seedDB = async () => {
  try {
    await Product.deleteMany({});
    console.log('Đã xóa tất cả sản phẩm cũ');
    
    const products = await Product.insertMany(sampleProducts);
    console.log(`Đã thêm ${products.length} sản phẩm mẫu vào cơ sở dữ liệu`);
    
    mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm mẫu:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDB();
