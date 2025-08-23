const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['initial', 'resubmission'],
    default: 'initial'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Personal details
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  // Documents
  profileImage: {
    type: String,
    required: true
  },
  documents: {
    aadhaar: {
      front: {
        type: String,
        required: true
      },
      back: {
        type: String,
        required: true
      }
    },
    pan: {
      front: {
        type: String,
        required: true
      }
    },
    drivingLicense: {
      front: String,
      back: String
    }
  },
  deliveryWork: {
    type: Boolean,
    default: false
  },
  // Admin details
  adminComments: {
    type: String
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: {
    type: Date
  },
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
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
verificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Verification', verificationSchema);
