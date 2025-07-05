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
  try {
    const { idToken, role } = req.body;
    if (!idToken || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number } = decodedToken;

    // Check if user exists in our database
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        firebaseUid: uid,
        phone: phone_number,
        role: role,
        name: `User ${uid.slice(-6)}`, // Generate a default name
        email: `${uid}@firebase.user`, // Generate a default email
      });
      await user.save();
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
      } 
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
});

module.exports = router; 