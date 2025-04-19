const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng phải ít nhất là 1']
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

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    ward: {
      type: String,
      required: true
    },
    fullAddress: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'transfer']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update full address before saving
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.shippingAddress.fullAddress = `${this.shippingAddress.street}, ${this.shippingAddress.ward}, ${this.shippingAddress.district}, ${this.shippingAddress.city}`;
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
