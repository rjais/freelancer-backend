const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Email field removed to avoid unique constraint issues - will be added by user during profile completion
  password: { type: String }, // Make password optional for Firebase users
  firebaseUid: { type: String, unique: true, sparse: true }, // Add Firebase UID
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  phone: { type: String, unique: true, sparse: true },
  freelancerId: { type: String, unique: true, sparse: true }, // 5-10 digit unique ID
  gender: { type: String },
  address: { type: String },
  profileImage: { type: String },
  skills: [{ type: String }],
  experience: { type: String },
  createdAt: { type: Date, default: Date.now },
  flat: { type: String },
  street: { type: String },
  landmark: { type: String },
  pincode: { type: String },
  city: { type: String },
  state: { type: String },
  walletBalance: { type: Number, default: 0 },
  
  // DigiLocker Verification Fields
  dateOfBirth: { type: Date },
  aadhaarNumber: { type: String }, // Will be encrypted
  isVerified: { type: Boolean, default: false },
  verificationMethod: { type: String, enum: ['digilocker', 'manual', 'cashfree_aadhaar', 'pending'] },
  verificationData: { type: mongoose.Schema.Types.Mixed }, // Store complete DigiLocker response
  verifiedAt: { type: Date },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'expired'], 
    default: 'pending' 
  },
  resubmissionCount: { type: Number, default: 0 }, // Track number of resubmissions
  adminComments: { type: String }, // Admin comments for rejection/approval
  
  // Manual Document Verification Fields
  documents: {
    aadhaar: {
      front: { type: String },
      back: { type: String },
      uploadedAt: { type: Date }
    },
    pan: {
      front: { type: String },
      back: { type: String },
      uploadedAt: { type: Date }
    },
    drivingLicense: {
      front: { type: String },
      back: { type: String },
      uploadedAt: { type: Date }
    }
  },
  
  // Delivery work preference
  deliveryWork: { type: Boolean, default: false },
  
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  paymentSettings: {
    autoWithdraw: { type: Boolean, default: false },
    minimumWithdrawal: { type: Number, default: 100 },
  }
});

module.exports = mongoose.model('User', UserSchema); 