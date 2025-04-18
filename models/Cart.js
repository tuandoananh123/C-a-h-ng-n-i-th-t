const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng phải ít nhất là 1'],
    default: 1
  },
  color: {
    type: String,
    default: 'Mặc định'
  },
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [CartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
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

// Method to calculate total amount and quantity
CartSchema.methods.calculateTotals = function() {
  const cart = this;
  cart.totalQuantity = 0;
  cart.totalAmount = 0;
  
  cart.items.forEach(item => {
    cart.totalQuantity += item.quantity;
    cart.totalAmount += item.totalPrice;
  });
  
  return cart;
};

// Pre-save middleware to update calculations
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateTotals();
  next();
});

module.exports = mongoose.model('Cart', CartSchema);
