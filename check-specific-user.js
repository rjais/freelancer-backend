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

const User = require('./models/User');

async function checkSpecificUser() {
  try {
    const firebaseUid = "VfUEr0HMZFZmKmqGBhsLLbPJrfn2";
    console.log(`🔍 Checking for Firebase UID: ${firebaseUid}`);
    
    const users = await User.find({ firebaseUid: firebaseUid });
    console.log(`Found ${users.length} users with this Firebase UID:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Verification Status: ${user.verificationStatus}`);
      console.log(`  Is Verified: ${user.isVerified}`);
    });
    
    // Also check by phone number
    const phoneNumber = "+917021098460";
    console.log(`\n🔍 Checking for phone number: ${phoneNumber}`);
    
    const usersByPhone = await User.find({ phone: phoneNumber });
    console.log(`Found ${usersByPhone.length} users with this phone number:`);
    
    usersByPhone.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Firebase UID: ${user.firebaseUid}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Verification Status: ${user.verificationStatus}`);
      console.log(`  Is Verified: ${user.isVerified}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
checkSpecificUser();
