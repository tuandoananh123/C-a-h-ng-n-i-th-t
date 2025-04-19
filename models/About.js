const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề không được để trống']
  },
  description: {
    type: String,
    required: [true, 'Mô tả không được để trống']
  },
  image: {
    type: String,
    required: [true, 'Đường dẫn hình ảnh không được để trống']
  },
  links: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware để cập nhật trường updatedAt trước khi lưu
AboutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('About', AboutSchema);
