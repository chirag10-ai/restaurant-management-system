const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  totalRevenue: {
    type: Number,
    default: 42000,  // Starting revenue
    required: true
  },
  transactions: [{
    // Either a payment or an order
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: {
      type: Number,
      required: true
    },
    // Type to distinguish between payment and order
    type: {
      type: String,
      enum: ['payment', 'order'],
      required: true
    },
    paymentMethod: {
      type: String
    },
    description: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Revenue', revenueSchema);