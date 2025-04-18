const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Họ tên không được để trống']
  },
  email: {
    type: String,
    required: [true, 'Email không được để trống'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Vui lòng nhập email hợp lệ']
  },
  subject: {
    type: String,
    required: [true, 'Tiêu đề không được để trống']
  },
  message: {
    type: String,
    required: [true, 'Nội dung tin nhắn không được để trống']
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', ContactSchema); 