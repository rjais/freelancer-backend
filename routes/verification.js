const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('../firebase-config');

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

// GET /api/verifications/debug - Debug endpoint to check stored data
router.get('/debug', async (req, res) => {
    try {
        const users = await User.find({}).select('name email phone verificationStatus isVerified documents address city state pincode dateOfBirth gender');
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch debug data',
            error: error.message
        });
    }
});

// POST /api/verifications - Submit verification (without Firebase auth for testing)
router.post('/submit', async (req, res) => {
    try {
        console.log('=== VERIFICATION SUBMISSION DEBUG ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Phone number from body:', req.body.phone);
        
        const {
            firstName,
            lastName,
            email,
            phone,
            dob,
            gender,
            address,
            pincode,
            documents,
            verificationStatus,
            isVerified,
            submittedAt
        } = req.body;

        // Find existing user by phone number
        let user = await User.findOne({ phone: phone });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register first.'
            });
        }

        // Update user with verification data
        const updateData = {
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            dateOfBirth: dob,
            gender: gender,
            address: address,
            pincode: pincode,
            verificationStatus: verificationStatus || 'pending',
            isVerified: isVerified || false,
            submittedAt: submittedAt || new Date()
        };

        // Add documents if provided
        if (documents) {
            console.log('Processing documents in submit route:', documents);
            
            // Initialize documents structure
            updateData.documents = {
                aadhaar: { front: null, back: null },
                pan: { front: null },
                drivingLicense: { front: null, back: null }
            };
            
            // Map document fields to the correct structure
            if (documents.profilePhoto) {
                updateData.profileImage = documents.profilePhoto;
                console.log('Profile photo saved:', documents.profilePhoto);
            }
            if (documents.aadharFront) {
                updateData.documents.aadhaar.front = documents.aadharFront;
                console.log('Aadhar front saved:', documents.aadharFront);
            }
            if (documents.aadharBack) {
                updateData.documents.aadhaar.back = documents.aadharBack;
                console.log('Aadhar back saved:', documents.aadharBack);
            }
            if (documents.panCard) {
                updateData.documents.pan.front = documents.panCard;
                console.log('PAN card saved:', documents.panCard);
            }
            if (documents.drivingLicenseFront) {
                updateData.documents.drivingLicense.front = documents.drivingLicenseFront;
                console.log('Driving license front saved:', documents.drivingLicenseFront);
            }
            if (documents.drivingLicenseBack) {
                updateData.documents.drivingLicense.back = documents.drivingLicenseBack;
                console.log('Driving license back saved:', documents.drivingLicenseBack);
            }
            
            console.log('Final documents structure:', updateData.documents);
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            updateData,
            { new: true, runValidators: true }
        );

        console.log('Verification submitted for user:', updatedUser._id);

        res.json({
            success: true,
            message: 'Verification submitted successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Verification submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit verification',
            error: error.message
        });
    }
});

module.exports = router;
