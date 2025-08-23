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

async function fixDuplicateFirebaseUids() {
  try {
    console.log('🔍 Checking for duplicate Firebase UIDs...');
    
    // Find all users with firebaseUid
    const usersWithFirebaseUid = await User.find({ firebaseUid: { $exists: true, $ne: null } });
    console.log(`Found ${usersWithFirebaseUid.length} users with Firebase UID`);
    
    // Group by firebaseUid
    const groupedByUid = {};
    usersWithFirebaseUid.forEach(user => {
      if (!groupedByUid[user.firebaseUid]) {
        groupedByUid[user.firebaseUid] = [];
      }
      groupedByUid[user.firebaseUid].push(user);
    });
    
    // Find duplicates
    const duplicates = Object.entries(groupedByUid).filter(([uid, users]) => users.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate Firebase UIDs found');
      return;
    }
    
    console.log(`Found ${duplicates.length} Firebase UIDs with duplicates:`);
    
    for (const [firebaseUid, users] of duplicates) {
      console.log(`\n🔧 Processing Firebase UID: ${firebaseUid}`);
      console.log(`   Found ${users.length} users with this UID:`);
      
      // Sort by creation date (newest first)
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Keep the newest user, delete the rest
      const userToKeep = users[0];
      const usersToDelete = users.slice(1);
      
      console.log(`   Keeping user: ${userToKeep._id} (created: ${userToKeep.createdAt})`);
      console.log(`   Deleting ${usersToDelete.length} duplicate users:`);
      
      for (const userToDelete of usersToDelete) {
        console.log(`     - ${userToDelete._id} (created: ${userToDelete.createdAt})`);
        await User.findByIdAndDelete(userToDelete._id);
      }
    }
    
    console.log('\n✅ Duplicate Firebase UIDs fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing duplicate Firebase UIDs:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDuplicateFirebaseUids();
