const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../firebase-config');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, gender, address } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      gender,
      address,
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Firebase authentication
router.post('/firebase', async (req, res) => {
  console.log('POST /api/auth/firebase called, req.body:', req.body); // Debug log for developer
  try {
    const { idToken, role } = req.body;
    console.log('Received idToken:', idToken ? idToken.substring(0, 20) + '...' : 'null'); // Debug log for developer
    if (!idToken || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if Firebase Admin is properly initialized
    if (!admin.apps.length) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ message: 'Firebase Admin not initialized' });
    }

    // Get phone number from request body or Firebase token
    let uid, phone_number;
    
    // First priority: Use phone number from request body
    phone_number = req.body.phone || req.body.phoneNumber;
    console.log('Phone number from request:', phone_number);
    
    if (phone_number) {
      // Phone number provided in request body - try to verify token first
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid; // Use actual Firebase UID
        console.log('Using provided phone number with verified token:', phone_number, 'UID:', uid);
      } catch (firebaseError) {
        console.log('Firebase token verification failed, using phone number only:', firebaseError.message);
        // If token verification fails, generate a unique UID based on phone
        uid = `phone_${phone_number.replace(/[^0-9]/g, '')}`;
        console.log('Generated UID from phone:', uid);
      }
    } else {
      // Try to extract from Firebase token
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        phone_number = decodedToken.phone_number;
        console.log('Successfully verified Firebase token');
      } catch (firebaseError) {
        console.log('Firebase token verification failed:', firebaseError.message);
        return res.status(401).json({ 
          message: 'Invalid Firebase token and no phone number provided',
          error: 'Please provide phone number in request body'
        });
      }
    }

    // Check if user exists in our database by phone number
    let user = await User.findOne({ phone: phone_number });
    let isNewUser = false;
    
    // Check if this is a login attempt (user doesn't exist)
    const action = req.body.action || 'signup'; // Default to signup for backward compatibility
    
    if (!user) {
      if (action === 'login') {
        // For login, don't create a new user - return 404
        console.log('❌ Login attempt with non-existent user:', phone_number);
        return res.status(404).json({ 
          message: 'No user found with this phone number. Please create an account first.',
          error: 'User not found'
        });
      }
      
      // Create new user if doesn't exist (for signup)
      try {
        // Create user data without email field to avoid unique constraint issues
        const userData = {
          firebaseUid: uid,
          phone: phone_number,
          role: role,
          name: `User ${phone_number.slice(-6)}`, // Generate a default name
          isVerified: false,
          verificationStatus: 'pending',
          verificationMethod: 'pending' // Set verification method to pending
        };
        
        console.log('Creating user with data:', userData);
        user = new User(userData);
        await user.save();
        isNewUser = true;
        console.log('✅ Created NEW user:', user._id, 'Phone:', phone_number, 'Role:', role);
        console.log('User creation successful, proceeding to token generation');
      } catch (saveError) {
        console.log('Save error details:', {
          code: saveError.code,
          keyPattern: saveError.keyPattern,
          message: saveError.message,
          errors: saveError.errors,
          name: saveError.name,
          stack: saveError.stack
        });
        
        if (saveError.code === 11000) {
          if (saveError.keyPattern && saveError.keyPattern.phone) {
            // Duplicate phone number - user was created in another request
            console.log('⚠️ Duplicate phone number detected, finding existing user');
            user = await User.findOne({ phone: phone_number });
            if (user) {
              console.log('✅ Found existing user after duplicate error:', user._id);
            } else {
              console.log('❌ User not found after duplicate phone error - phone:', phone_number);
              throw new Error('Failed to create or find user with this phone number - duplicate phone but user not found');
            }
          } else if (saveError.keyPattern && saveError.keyPattern.firebaseUid) {
            // Duplicate Firebase UID - find user by phone instead
            console.log('⚠️ Duplicate Firebase UID detected, finding user by phone');
            user = await User.findOne({ phone: phone_number });
            if (user) {
              console.log('✅ Found existing user by phone after Firebase UID duplicate:', user._id);
              // Update the Firebase UID to match
              user.firebaseUid = uid;
              await user.save();
            } else {
              console.log('❌ User not found after duplicate Firebase UID error - phone:', phone_number);
              throw new Error('Failed to create or find user with this phone number - duplicate Firebase UID but user not found');
            }
          } else if (saveError.keyPattern && saveError.keyPattern.email) {
            // Duplicate email - this shouldn't happen since we don't generate emails anymore
            console.log('⚠️ Unexpected duplicate email error - this should not happen');
            console.log('Attempting to find user by phone number as fallback');
            user = await User.findOne({ phone: phone_number });
            if (user) {
              console.log('✅ Found existing user by phone after unexpected email duplicate:', user._id);
            } else {
              console.log('❌ No user found - this might be a database inconsistency');
              // Instead of throwing an error, try to create the user again without any email field
              console.log('Attempting to create user again without email field');
              // Retry user creation without email field
              const retryUserData = {
                firebaseUid: uid,
                phone: phone_number,
                role: role,
                name: `User ${phone_number.slice(-6)}`,
                isVerified: false,
                verificationStatus: 'pending',
                verificationMethod: 'pending'
              };
              user = new User(retryUserData);
              await user.save();
              isNewUser = true;
              console.log('✅ Successfully created user on retry:', user._id);
            }
          } else {
            throw saveError;
          }
        } else {
          console.log('Non-duplicate key error:', saveError);
          console.log('Error type:', typeof saveError);
          console.log('Error constructor:', saveError.constructor.name);
          
          // If it's a validation error, provide a more specific message
          if (saveError.name === 'ValidationError') {
            console.log('Validation error details:', saveError.errors);
            throw new Error(`Validation failed: ${Object.keys(saveError.errors).join(', ')}`);
          }
          
          throw saveError;
        }
      }
    } else {
      // User exists - update firebaseUid if needed and role
      console.log('🔄 Existing user found:', user._id, 'Phone:', phone_number, 'Current role:', user.role, 'Requested role:', role);
      
      let updated = false;
      if (user.firebaseUid !== uid) {
        user.firebaseUid = uid;
        updated = true;
        console.log('Updated firebaseUid');
      }
      if (!user.role || user.role !== role) {
        console.log(`Updating user role from ${user.role || 'undefined'} to ${role}`);
        user.role = role;
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log('✅ User updated successfully');
      }
      
      console.log('📊 User status - isVerified:', user.isVerified, 'verificationStatus:', user.verificationStatus);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        phone: user.phone, 
        role: user.role 
      },
      isNewUser: isNewUser,
      needsVerification: user.role === 'freelancer' && (!user.isVerified || user.verificationStatus === 'pending'),
      verificationStatus: user.verificationStatus,
      isRejected: user.verificationStatus === 'rejected'
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(401).json({ message: 'Invalid Firebase token', error: err.message });
  }
});

// Test Firebase Admin initialization
router.get('/firebase-test', async (req, res) => {
  try {
    console.log('Firebase apps:', admin.apps.length);
    console.log('Firebase config:', admin.apps[0] ? admin.apps[0].options : 'No apps');
    
    if (!admin.apps.length) {
      return res.status(500).json({ 
        message: 'Firebase Admin not initialized',
        apps: admin.apps.length,
        error: 'No Firebase apps found'
      });
    }
    
    res.json({ 
      message: 'Firebase Admin is initialized',
      apps: admin.apps.length,
      projectId: admin.apps[0].options.projectId
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({ 
      message: 'Firebase Admin error',
      error: error.message
    });
  }
});

module.exports = router; 