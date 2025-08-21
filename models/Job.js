const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  flat: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String, required: true },
  pincode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postOfficeName: { type: String },
  peopleRequired: { type: Number, required: true },
  genderPreference: { type: String, default: 'Any' },
  price: { type: Number, required: true },
  status: { type: String, enum: ['open', 'assigned', 'in_progress', 'completed', 'paid'], default: 'open' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  assignedAt: { type: Date },
  completedAt: { type: Date },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', JobSchema); 