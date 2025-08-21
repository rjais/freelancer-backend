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

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number } = decodedToken;

    // Check if user exists in our database by phone number (for new signups)
    let user = await User.findOne({ phone: phone_number });
    let isNewUser = false;
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        firebaseUid: uid,
        phone: phone_number,
        role: role,
        name: `User ${uid.slice(-6)}`, // Generate a default name
        email: `${uid}@firebase.user`, // Generate a default email
        isVerified: false,
        verificationStatus: 'pending'
      });
      await user.save();
      isNewUser = true;
      console.log('Created new user:', user._id, 'Phone:', phone_number);
    } else {
      // User exists, update firebaseUid if needed and role
      if (user.firebaseUid !== uid) {
        user.firebaseUid = uid;
      }
      if (!user.role || user.role !== role) {
        console.log(`Updating user role from ${user.role || 'undefined'} to ${role}`);
        user.role = role;
      }
      await user.save();
      console.log('Existing user found:', user._id, 'Phone:', phone_number, 'isVerified:', user.isVerified);
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
      needsVerification: user.role === 'freelancer' && (!user.isVerified || user.verificationStatus === 'pending')
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(401).json({ message: 'Invalid Firebase token' });
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