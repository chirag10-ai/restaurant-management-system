const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: props => `Please enter only 10 digit number (no negative values allowed). Got: ${props.value}`
    }
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  tableNumbers: {
    type: [Number],
    required: true
  },
  tableType: {
    type: String,
    required: true,
    enum: ['indoor', 'outdoor', 'vip']
  },
  specialRequests: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirm', 'cancel'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  paymentAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
bookingSchema.index({ date: 1, time: 1 });
bookingSchema.index({ customerEmail: 1 });

module.exports = mongoose.model('Booking', bookingSchema);