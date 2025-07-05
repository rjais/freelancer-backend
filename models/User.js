const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Make password optional for Firebase users
  firebaseUid: { type: String, unique: true, sparse: true }, // Add Firebase UID
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  phone: { type: String },
  gender: { type: String },
  address: { type: String },
  profileImage: { type: String },
  skills: [{ type: String }],
  experience: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema); 