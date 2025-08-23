var express = require('express');
var router = express.Router();
const User = require('../models/User');
const admin = require('../firebase-config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { encrypt, decrypt } = require('../utils/encryption');

// Middleware to protect routes using Firebase ID token
async function firebaseAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const idToken = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Fetch user from database to get role and MongoDB ID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please complete your profile.' });
    }
    
    req.user = {
      ...decodedToken,
      role: user.role,
      mongoId: user._id
    };
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid Firebase ID token', error: err.message });
  }
}

// Multer storage config for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Multer storage config for verification documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/documents'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${req.params.id}_${req.params.documentType}_${req.params.side}_${Date.now()}${ext}`);
  }
});
const documentUpload = multer({ storage: documentStorage });

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Get user profile by ID
router.get('/:id', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-firebaseUid -password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User profile fetched:', {
      id: user._id,
      name: user.name,
      isVerified: user.isVerified,
      freelancerId: user.freelancerId
    });
    res.json(user);
  } catch (err) {
    console.error('Error in GET /api/users/:id:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user verification status (uses Firebase authentication)
router.patch('/:id/verification-status', firebaseAuth, async (req, res) => {
  try {
    // Only allow users to update their own verification status
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this verification status' });
    }

    const { isVerified, verificationStatus } = req.body;
    
    const updateData = {};
    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
    }
    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus;
    }
    
    if (isVerified) {
      updateData.verifiedAt = new Date();
    }

    console.log('Updating user verification status:', { userId: req.params.id, updateData });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User verification status updated successfully:', { 
      userId: user._id, 
      isVerified: user.isVerified, 
      verificationStatus: user.verificationStatus 
    });

    res.json({ 
      message: 'Verification status updated successfully',
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus
    });
  } catch (err) {
    console.error('Error updating verification status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile
router.patch('/:id', firebaseAuth, async (req, res) => {
  try {
    // Only allow users to update their own profile
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'gender', 'address', 'profileImage', 'skills', 'experience',
      'flat', 'street', 'landmark', 'pincode', 'city', 'state', 'bankDetails',
      // DigiLocker verification fields
      'dateOfBirth', 'aadhaarNumber', 'isVerified', 'verificationMethod', 'verificationData', 
      'verifiedAt', 'verificationStatus', 'deliveryWork'
    ];
    const updateData = {};
    
    // Only allow specific fields to be updated
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    console.log('PATCH updateData:', updateData);

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    ).select('-firebaseUid -password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error in PATCH /api/users/:id:', err);
    
    // Handle duplicate email error specifically
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ 
        message: 'Email already in use. Please use a different email address.',
        error: 'Duplicate email'
      });
    }
    
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile image upload route
router.patch('/:id/photo', firebaseAuth, upload.single('profileImage'), async (req, res) => {
  try {
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Save the public URL to the user's profileImage field
    const imageUrl = `/images/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageUrl },
      { new: true, runValidators: true }
    ).select('-firebaseUid -password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ profileImage: imageUrl, user });
  } catch (err) {
    console.error('Error in PATCH /api/users/:id/photo:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Serve profile image by user ID
router.get('/:id/photo', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profileImage) {
      return res.status(404).send('No profile image');
    }
    // The profileImage field is a path like '/images/filename.jpg'
    const imagePath = path.join(__dirname, '../public', user.profileImage);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).send('Image file not found');
    }
    res.sendFile(imagePath);
  } catch (err) {
    console.error('Error in GET /api/users/:id/photo:', err);
    res.status(500).send('Server error');
  }
});

// Identity verification update route (supports both DigiLocker and Cashfree Aadhaar)
router.patch('/:id/verify', firebaseAuth, async (req, res) => {
  try {
    // Only allow users to update their own verification
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this verification' });
    }

    const { 
      name, 
      dateOfBirth, 
      gender, 
      address, 
      aadhaarNumber, 
      verificationData,
      verificationMethod = 'cashfree_aadhaar' // Default to Cashfree Aadhaar
    } = req.body;

    // Validate required fields
    if (!aadhaarNumber || !verificationData) {
      return res.status(400).json({ 
        message: 'Missing required verification fields' 
      });
    }

    // Prepare update data
    const updateData = {
      aadhaarNumber: encrypt(aadhaarNumber), // Encrypt Aadhaar number
      isVerified: true,
      verificationMethod,
      verificationData,
      verifiedAt: new Date(),
      verificationStatus: 'verified'
    };

    // Add optional fields if provided (for DigiLocker)
    if (name) updateData.name = name;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;

    console.log(`${verificationMethod} verification updateData:`, updateData);

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    ).select('-firebaseUid -password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Verification completed successfully',
      user: {
        id: user._id,
        name: user.name,
        isVerified: user.isVerified,
        verificationMethod: user.verificationMethod,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (err) {
    console.error('Error in PATCH /api/users/:id/verify:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get verification status
router.get('/:id/verification', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'isVerified verificationMethod verificationStatus verifiedAt verificationData'
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isVerified: user.isVerified,
      verificationMethod: user.verificationMethod,
      verificationStatus: user.verificationStatus,
      verifiedAt: user.verifiedAt,
      hasVerificationData: !!user.verificationData
    });
  } catch (err) {
    console.error('Error in GET /api/users/:id/verification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Document upload routes for manual verification
router.patch('/:id/documents/:documentType/:side', firebaseAuth, documentUpload.single('document'), async (req, res) => {
  try {
    // Only allow users to upload their own documents
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload documents for this user' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType, side } = req.params;
    const documentUrl = `/documents/${req.file.filename}`;
    
    // Validate document type
    const validDocumentTypes = ['aadhaar', 'pan', 'drivingLicense'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Validate side
    const validSides = ['front', 'back'];
    if (!validSides.includes(side)) {
      return res.status(400).json({ message: 'Invalid document side' });
    }

    // Update user document
    const updateData = {
      [`documents.${documentType}.${side}`]: documentUrl,
      [`documents.${documentType}.uploadedAt`]: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-firebaseUid -password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Document uploaded successfully',
      documentUrl,
      user: {
        id: user._id,
        documents: user.documents
      }
    });
  } catch (err) {
    console.error('Error in PATCH /api/users/:id/documents/:documentType/:side:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit documents for verification
router.post('/:id/submit-verification', firebaseAuth, async (req, res) => {
  try {
    // Only allow users to submit their own verification
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit verification for this user' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if required documents are uploaded
    const { documents } = user;
    const requiredDocuments = ['aadhaar', 'pan'];
    const missingDocuments = [];

    // Check Aadhaar (front and back required)
    if (!documents.aadhaar || !documents.aadhaar.front || !documents.aadhaar.back) {
      missingDocuments.push('Aadhaar (front and back)');
    }

    // Check PAN (only front required)
    if (!documents.pan || !documents.pan.front) {
      missingDocuments.push('PAN (front)');
    }

    // Check Driving License (only if delivery work is enabled)
    if (user.deliveryWork && (!documents.drivingLicense || !documents.drivingLicense.front || !documents.drivingLicense.back)) {
      missingDocuments.push('Driving License (front and back)');
    }

    if (missingDocuments.length > 0) {
      return res.status(400).json({
        message: 'Missing required documents',
        missingDocuments
      });
    }

    // Create verification record
    const Verification = require('../models/Verification');
    const verification = new Verification({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      documentType: 'manual',
      documents: {
        aadhaar: documents.aadhaar,
        pan: documents.pan,
        drivingLicense: documents.drivingLicense
      },
      status: 'pending',
      deliveryWork: user.deliveryWork || false
    });

    await verification.save();

    // Update user verification status
    await User.findByIdAndUpdate(req.params.id, {
      verificationMethod: 'manual',
      verificationStatus: 'pending'
    });

    res.json({
      message: 'Verification submitted successfully',
      verificationId: verification._id,
      status: 'pending'
    });
  } catch (err) {
    console.error('Error in POST /api/users/:id/submit-verification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user documents
router.get('/:id/documents', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('documents');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      documents: user.documents
    });
  } catch (err) {
    console.error('Error in GET /api/users/:id/documents:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Resubmit verification endpoint
router.post('/:id/resubmit-verification', firebaseAuth, async (req, res) => {
  try {
    // Only allow users to resubmit their own verification
    if (req.params.id !== req.user.mongoId.toString()) {
      return res.status(403).json({ message: 'Not authorized to resubmit verification for this user' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is currently rejected
    if (user.verificationStatus !== 'rejected') {
      return res.status(400).json({ message: 'User is not in rejected status' });
    }

    // Reset verification status to pending and increment resubmission count
    const updateData = {
      verificationStatus: 'pending',
      isVerified: false,
      rejectedAt: null,
      adminComments: null,
      resubmissionCount: (user.resubmissionCount || 0) + 1
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    console.log('User verification resubmitted:', {
      userId: req.params.id,
      newStatus: 'pending'
    });

    res.json({
      success: true,
      message: 'Verification resubmitted successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error in POST /api/users/:id/resubmit-verification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
