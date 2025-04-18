const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for updating product colors'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateProductColors() {
  try {
    // Cập nhật tất cả sản phẩm với mảng colors mặc định
    const defaultColors = ['Đen', 'Trắng', 'Bạc'];
    
    const result = await Product.updateMany(
      { colors: { $exists: false } }, // Tìm những sản phẩm chưa có trường colors
      { $set: { colors: defaultColors } } // Thêm trường colors với giá trị mặc định
    );
    
    console.log(`Đã cập nhật ${result.modifiedCount} sản phẩm với trường colors`);
    
    // Hiển thị danh sách sản phẩm đã cập nhật
    const products = await Product.find({}, 'name colors');
    console.log('Danh sách sản phẩm và màu sắc:');
    products.forEach(product => {
      console.log(`- ${product.name}: ${product.colors.join(', ')}`);
    });
    
    console.log('Hoàn tất cập nhật màu sắc sản phẩm');
  } catch (error) {
    console.error('Lỗi khi cập nhật màu sắc sản phẩm:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateProductColors();
