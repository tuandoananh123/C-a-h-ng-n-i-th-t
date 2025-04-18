const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string - sử dụng giá trị từ .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/household-goods-store';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        
        console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        console.error('Error details:', error);
        // Không thoát khỏi process để server vẫn chạy ngay cả khi không kết nối được DB
        // process.exit(1);
    }
};

module.exports = { connectDB, MONGODB_URI };
