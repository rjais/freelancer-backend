const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/people', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testUserCreation() {
    try {
        console.log('Testing user creation...');
        
        const userData = {
            firebaseUid: 'phone_7021098460',
            phone: '+917021098460',
            role: 'freelancer',
            name: 'User 098460',
            isVerified: false,
            verificationStatus: 'pending',
            verificationMethod: 'pending'
        };
        
        console.log('User data:', userData);
        
        const user = new User(userData);
        console.log('User object created, attempting to save...');
        
        await user.save();
        console.log('✅ User saved successfully:', user._id);
        
        // Clean up - delete the test user
        await User.findByIdAndDelete(user._id);
        console.log('✅ Test user deleted');
        
    } catch (error) {
        console.error('❌ Error creating user:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            keyPattern: error.keyPattern,
            errors: error.errors
        });
    } finally {
        mongoose.connection.close();
    }
}

testUserCreation();
