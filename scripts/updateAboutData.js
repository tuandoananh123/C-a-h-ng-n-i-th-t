/**
 * Script để cập nhật dữ liệu About trong MongoDB
 * Cách dùng: node scripts/updateAboutData.js
 */

const mongoose = require('mongoose');
const About = require('../models/About');
require('dotenv').config();

// Dữ liệu About mẫu
const aboutData = {
  title: 'Household Goods Store - Đồ dùng gia đình chất lượng cao',
  description: 'Chúng tôi là cửa hàng chuyên cung cấp các sản phẩm đồ dùng gia đình chất lượng cao, đa dạng mẫu mã với giá cả hợp lý. Sứ mệnh của chúng tôi là mang đến những sản phẩm tiện ích, an toàn và thân thiện với môi trường cho mọi gia đình Việt.',
  image: '/images/banner-about.jpg',
  links: [
    'https://facebook.com/householdgoods', 
    'https://householdgoodsstore.com'
  ]
};

async function connectToDatabase() {
  try {
    // Lấy chuỗi kết nối MongoDB từ biến môi trường
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('Error: MONGODB_URI không được định nghĩa trong file .env');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối MongoDB thành công');
    return true;
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error);
    return false;
  }
}

async function updateAboutData() {
  try {
    const connected = await connectToDatabase();
    if (!connected) return;

    // Kiểm tra xem dữ liệu About đã tồn tại chưa
    let existing = await About.findOne();
    
    if (existing) {
      // Cập nhật dữ liệu hiện có
      existing.title = aboutData.title;
      existing.description = aboutData.description;
      existing.image = aboutData.image;
      existing.links = aboutData.links;
      
      await existing.save();
      console.log('Cập nhật dữ liệu About thành công');
    } else {
      // Tạo dữ liệu mới
      await About.create(aboutData);
      console.log('Tạo mới dữ liệu About thành công');
    }
    
    // Đóng kết nối
    await mongoose.connection.close();
    console.log('Đóng kết nối MongoDB');
  } catch (error) {
    console.error('Lỗi khi cập nhật dữ liệu About:', error);
    
    // Đảm bảo kết nối được đóng ngay cả khi có lỗi
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Chạy hàm cập nhật
updateAboutData();
