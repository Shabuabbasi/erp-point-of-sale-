const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    isWalkIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
