const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// User Schema (same as your backend)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  phone: { type: String },
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
  dateOfBirth: { type: Date },
  aadhaarNumber: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationMethod: { type: String, enum: ['digilocker', 'manual', 'pending'] },
  verificationData: { type: mongoose.Schema.Types.Mixed },
  verifiedAt: { type: Date },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'expired'], 
    default: 'pending' 
  },
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

const User = mongoose.model('User', UserSchema);

async function deleteTestUser() {
  try {
    console.log('🔍 Searching for test user with phone number: +91 7021098460');
    
    // Try different phone number formats
    const phoneNumbers = [
      '+91 7021098460',
      '+917021098460',
      '7021098460',
      '917021098460'
    ];
    
    let deletedUser = null;
    
    for (const phone of phoneNumbers) {
      const user = await User.findOne({ phone: phone });
      if (user) {
        console.log(`✅ Found user with phone: ${phone}`);
        console.log('User details:', {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          createdAt: user.createdAt
        });
        
        // Delete the user
        const result = await User.deleteOne({ _id: user._id });
        
        if (result.deletedCount > 0) {
          console.log('✅ User deleted successfully!');
          deletedUser = user;
          break;
        }
      }
    }
    
    if (!deletedUser) {
      console.log('❌ No user found with the test phone number');
      
      // Show all users for reference
      const allUsers = await User.find({}).select('name email phone role createdAt');
      console.log('\n📋 All users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.phone}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the deletion
deleteTestUser();
