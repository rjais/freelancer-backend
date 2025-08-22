const mongoose = require('mongoose');
require('dotenv').config();

async function removeEmailField() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the database instance
        const db = mongoose.connection.db;
        
        // Get the users collection
        const usersCollection = db.collection('users');
        
        console.log('Starting email field removal process...');
        
        // Step 1: Remove the unique index on email field
        try {
            console.log('Removing unique index on email field...');
            await usersCollection.dropIndex('email_1');
            console.log('✅ Successfully removed email unique index');
        } catch (error) {
            if (error.code === 26) {
                console.log('ℹ️ Email index does not exist, skipping...');
            } else {
                console.log('⚠️ Error removing email index:', error.message);
            }
        }
        
        // Step 2: Remove email field from all documents
        console.log('Removing email field from all user documents...');
        const result = await usersCollection.updateMany(
            {}, // Update all documents
            { $unset: { email: "" } } // Remove email field
        );
        console.log(`✅ Removed email field from ${result.modifiedCount} documents`);
        
        // Step 3: Verify the changes
        console.log('Verifying changes...');
        const totalUsers = await usersCollection.countDocuments();
        const usersWithEmail = await usersCollection.countDocuments({ email: { $exists: true } });
        
        console.log(`📊 Total users: ${totalUsers}`);
        console.log(`📊 Users with email field: ${usersWithEmail}`);
        
        if (usersWithEmail === 0) {
            console.log('✅ Success: No users have email field remaining');
        } else {
            console.log('⚠️ Warning: Some users still have email field');
        }
        
        // Step 4: Test creating a new user without email
        console.log('Testing user creation without email...');
        const testUser = {
            name: 'Test User',
            phone: '+919999999999',
            role: 'freelancer',
            firebaseUid: 'test-uid-' + Date.now(),
            isVerified: false,
            verificationStatus: 'pending',
            verificationMethod: 'pending',
            createdAt: new Date()
        };
        
        const insertResult = await usersCollection.insertOne(testUser);
        console.log('✅ Successfully created test user without email');
        
        // Clean up test user
        await usersCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('✅ Cleaned up test user');
        
        console.log('🎉 Email field removal completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during email field removal:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
removeEmailField()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
