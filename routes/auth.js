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

    // Check if user exists in our database by phone number or Firebase UID
    let user = await User.findOne({ phone: phone_number });
    let isNewUser = false;
    
    // If no user found by phone, check by Firebase UID
    if (!user && uid) {
      user = await User.findOne({ firebaseUid: uid });
      if (user) {
        console.log('🔍 Found user by Firebase UID:', user._id, 'Phone:', user.phone, 'Requested phone:', phone_number);
        
        // If phone numbers don't match, update the phone number
        if (user.phone !== phone_number) {
          console.log('📱 Updating phone number from', user.phone, 'to', phone_number);
          user.phone = phone_number;
          await user.save();
        }
      }
    }
    
    // Check if this is a login attempt or account creation
    const action = req.body.action || 'login'; // Default to login for security
    
    if (!user) {
      if (action === 'signup') {
        // For signup action, don't create user in database yet
        // User will be created only when they submit verification documents
        console.log('📝 Signup action detected - user will be created during verification submission');
        
        // Return a temporary user object for the frontend
        user = {
          _id: `temp_${Date.now()}`, // Temporary ID for frontend
          phone: phone_number,
          role: role,
          firebaseUid: uid,
          isNewUser: true,
          verificationStatus: null, // No status yet
          isVerified: false
        };
        isNewUser = true;
      } else {
        // Login attempt with non-existent user
        console.log('❌ No user found in database:', phone_number);
        return res.status(404).json({ 
          message: 'Create account first to login',
          error: 'User not found'
        });
      }
    } else {
      // User exists - check their verification status for login
      console.log('✅ User found:', user._id, 'Phone:', phone_number, 'Status:', user.verificationStatus);
      
      if (action === 'login') {
        // Allow login for all users, including rejected ones (so they can see rejection modal)
        // Only block users who haven't submitted verification yet
        if (!user.verificationStatus) {
          console.log('❌ User cannot login - no verification status:', user.verificationStatus);
          return res.status(403).json({ 
            message: 'Create account first to login',
            error: 'Account not verified',
            verificationStatus: user.verificationStatus
          });
        }
      }
      
      // User exists - update firebaseUid if needed and role
      console.log('🔄 Existing user found:', user._id, 'Phone:', phone_number, 'Current role:', user.role, 'Requested role:', role);
      
      let updated = false;
      
      // Check if firebaseUid needs to be updated
      if (user.firebaseUid !== uid) {
        // Check if the new UID is already used by another user
        const existingUserWithUid = await User.findOne({ firebaseUid: uid });
        if (existingUserWithUid && existingUserWithUid._id.toString() !== user._id.toString()) {
          console.log('⚠️ Firebase UID already used by another user, removing from current user');
          // Remove firebaseUid from current user to avoid conflict
          user.firebaseUid = undefined;
        } else {
          user.firebaseUid = uid;
        }
        updated = true;
        console.log('Updated firebaseUid');
      }
      if (!user.role || user.role !== role) {
        console.log(`Updating user role from ${user.role || 'undefined'} to ${role}`);
        user.role = role;
        updated = true;
      }
      
      if (updated) {
        try {
          await user.save();
          console.log('✅ User updated successfully');
        } catch (saveError) {
          console.error('❌ Error saving user updates:', saveError);
          
          // Handle duplicate key errors
          if (saveError.code === 11000) {
            console.log('🔄 Duplicate key error detected, trying to resolve...');
            
            // If it's a firebaseUid duplicate, remove it and try again
            if (saveError.keyPattern && saveError.keyPattern.firebaseUid) {
              console.log('🔄 Removing conflicting firebaseUid and retrying...');
              user.firebaseUid = undefined;
              await user.save();
              console.log('✅ User updated successfully after removing conflicting firebaseUid');
            } else {
              throw saveError; // Re-throw if it's not a firebaseUid issue
            }
          } else {
            throw saveError; // Re-throw other errors
          }
        }
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