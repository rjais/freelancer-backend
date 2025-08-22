const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB using the deployed database
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://rjais:rjais123@cluster0.mongodb.net/people?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Generate unique Freelancer ID (5-10 digits)
async function generateFreelancerId() {
  let freelancerId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate a random number between 10000 and 999999999 (5-9 digits)
    freelancerId = Math.floor(Math.random() * 900000000) + 10000;
    freelancerId = freelancerId.toString();
    
    // Check if this ID already exists
    const existingUser = await User.findOne({ freelancerId });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return freelancerId;
}

async function assignFreelancerId() {
  try {
    console.log('Assigning Freelancer ID...');
    
    // Find the most recently verified freelancer without a freelancerId
    const user = await User.findOne({ 
      role: 'freelancer', 
      isVerified: true,
      freelancerId: { $exists: false }
    }).sort({ verifiedAt: -1 });
    
    if (!user) {
      // Check if any verified freelancer exists
      const verifiedUser = await User.findOne({ 
        role: 'freelancer', 
        isVerified: true 
      }).sort({ verifiedAt: -1 });
      
      if (verifiedUser) {
        console.log('Found verified freelancer with existing freelancerId:');
        console.log('- Name:', verifiedUser.name);
        console.log('- Phone:', verifiedUser.phone);
        console.log('- Freelancer ID:', verifiedUser.freelancerId);
        return;
      } else {
        console.log('No verified freelancers found');
        return;
      }
    }
    
    console.log('Found verified freelancer without freelancerId:');
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Is Verified:', user.isVerified);
    console.log('- Verified At:', user.verifiedAt);
    
    // Generate and assign freelancer ID
    const freelancerId = await generateFreelancerId();
    console.log('- Generated Freelancer ID:', freelancerId);
    
    // Update the user
    await User.findByIdAndUpdate(user._id, {
      freelancerId: freelancerId
    });
    
    console.log('✅ Freelancer ID assigned successfully!');
    
    // Verify the update
    const updatedUser = await User.findById(user._id);
    console.log('- Updated Freelancer ID:', updatedUser.freelancerId);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

assignFreelancerId();
