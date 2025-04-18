const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả sản phẩm là bắt buộc']
  },
  price: {
    type: Number,
    required: [true, 'Giá sản phẩm là bắt buộc'],
    min: [0, 'Giá không thể là số âm']
  },
  stock: {
    type: Number,
    required: [true, 'Số lượng tồn kho là bắt buộc'],
    min: [0, 'Số lượng không thể là số âm'],
    default: 0
  },
  images: {
    type: [String],
    default: ['/images/default-product.jpg']
  },
  colors: {
    type: [String],
    default: ['Đen', 'Trắng']
  },
  category: {
    type: String,
    required: [true, 'Danh mục sản phẩm là bắt buộc']
  },
  featured: {
    type: Boolean,
    default: false
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

// Update the updatedAt field before saving
ProductSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
