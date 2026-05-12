const mongoose = require('mongoose');

const passwordChangeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

passwordChangeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PasswordChange', passwordChangeSchema);

