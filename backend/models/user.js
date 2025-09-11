// models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: {
    type: String, required: true, unique: true
  },
  passwordHash: {
    type: String, required: true
  },
  name: String,
  role: {
    type: String, default: 'admin'
  },
  createdAt: {
    type: Date, default: Date.now
  }
});
module.exports = mongoose.model('User', UserSchema);
