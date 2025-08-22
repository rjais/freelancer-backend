const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/people', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testFreelancerId() {
  try {
    console.log('Testing Freelancer ID...');
    
    // Find the most recently verified freelancer
    const user = await User.findOne({ 
      role: 'freelancer', 
      isVerified: true 
    }).sort({ verifiedAt: -1 });
    
    if (user) {
      console.log('Found verified freelancer:');
      console.log('- Name:', user.name);
      console.log('- Phone:', user.phone);
      console.log('- Is Verified:', user.isVerified);
      console.log('- Verification Status:', user.verificationStatus);
      console.log('- Verified At:', user.verifiedAt);
      console.log('- Freelancer ID:', user.freelancerId);
      console.log('- All fields:', Object.keys(user.toObject()));
    } else {
      console.log('No verified freelancers found');
      
      // Check all freelancers
      const allFreelancers = await User.find({ role: 'freelancer' });
      console.log('\nAll freelancers:');
      allFreelancers.forEach(f => {
        console.log(`- ${f.name} (${f.phone}): verified=${f.isVerified}, freelancerId=${f.freelancerId}`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testFreelancerId();
