const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

async function fixDuplicateFirebaseUid() {
  try {
    console.log('🔍 Searching for duplicate Firebase UID: VfUEr0HMZFZmKmqGBhsLLbPJrfn2');
    
    // Find all users with this Firebase UID
    const usersWithUid = await User.find({ firebaseUid: 'VfUEr0HMZFZmKmqGBhsLLbPJrfn2' });
    
    console.log(`Found ${usersWithUid.length} users with this Firebase UID:`);
    
    usersWithUid.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Updated: ${user.updatedAt}`);
      console.log(`  Verification Status: ${user.verificationStatus}`);
    });
    
    if (usersWithUid.length > 1) {
      console.log('\n🗑️ Removing duplicate users...');
      
      // Keep the most recent user (based on updatedAt)
      const sortedUsers = usersWithUid.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const userToKeep = sortedUsers[0];
      const usersToDelete = sortedUsers.slice(1);
      
      console.log(`\n✅ Keeping user: ${userToKeep._id} (Phone: ${userToKeep.phone})`);
      
      // Delete the duplicate users
      for (const user of usersToDelete) {
        console.log(`🗑️ Deleting user: ${user._id} (Phone: ${user.phone})`);
        await User.findByIdAndDelete(user._id);
      }
      
      console.log(`\n✅ Successfully deleted ${usersToDelete.length} duplicate users`);
    } else if (usersWithUid.length === 1) {
      console.log('\n✅ Only one user found with this Firebase UID - no duplicates to fix');
    } else {
      console.log('\n❌ No users found with this Firebase UID');
    }
    
    // Also check for any other duplicate Firebase UIDs
    console.log('\n🔍 Checking for any other duplicate Firebase UIDs...');
    
    const duplicateUids = await User.aggregate([
      {
        $group: {
          _id: '$firebaseUid',
          count: { $sum: 1 },
          users: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    if (duplicateUids.length > 0) {
      console.log(`\n⚠️ Found ${duplicateUids.length} other Firebase UIDs with duplicates:`);
      
      for (const duplicate of duplicateUids) {
        console.log(`\nFirebase UID: ${duplicate._id}`);
        console.log(`Count: ${duplicate.count}`);
        console.log(`User IDs: ${duplicate.users.join(', ')}`);
      }
    } else {
      console.log('\n✅ No other duplicate Firebase UIDs found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicate Firebase UID:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixDuplicateFirebaseUid();
