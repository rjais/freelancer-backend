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
            city,
            state,
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
            city: city,
            state: state,
            pincode: pincode,
            verificationStatus: verificationStatus || 'pending',
            isVerified: isVerified || false,
            submittedAt: submittedAt || new Date()
        };

        // Add documents if provided
        if (documents) {
            // Initialize documents structure
            updateData.documents = {
                aadhaar: { front: null, back: null },
                pan: { front: null },
                drivingLicense: { front: null, back: null }
            };
            
            // Map document fields to the correct structure
            if (documents.profilePhoto) updateData.profileImage = documents.profilePhoto;
            if (documents.aadharFront) updateData.documents.aadhaar.front = documents.aadharFront;
            if (documents.aadharBack) updateData.documents.aadhaar.back = documents.aadharBack;
            if (documents.panCard) updateData.documents.pan.front = documents.panCard;
            if (documents.drivingLicenseFront) updateData.documents.drivingLicense.front = documents.drivingLicenseFront;
            if (documents.drivingLicenseBack) updateData.documents.drivingLicense.back = documents.drivingLicenseBack;
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

// POST /api/verifications - Submit verification
router.post('/', firebaseAuth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dob,
            gender,
            address,
            city,
            state,
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
            city: city,
            state: state,
            pincode: pincode,
            verificationStatus: verificationStatus || 'pending',
            isVerified: isVerified || false,
            submittedAt: submittedAt || new Date()
        };

        // Add documents if provided
        if (documents) {
            // Initialize documents structure
            updateData.documents = {
                aadhaar: { front: null, back: null },
                pan: { front: null },
                drivingLicense: { front: null, back: null }
            };
            
            // Map document fields to the correct structure
            if (documents.profilePhoto) updateData.profileImage = documents.profilePhoto;
            if (documents.aadharFront) updateData.documents.aadhaar.front = documents.aadharFront;
            if (documents.aadharBack) updateData.documents.aadhaar.back = documents.aadharBack;
            if (documents.panCard) updateData.documents.pan.front = documents.panCard;
            if (documents.drivingLicenseFront) updateData.documents.drivingLicense.front = documents.drivingLicenseFront;
            if (documents.drivingLicenseBack) updateData.documents.drivingLicense.back = documents.drivingLicenseBack;
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

// Get all verified users (for admin purposes)
router.get('/verified-users', firebaseAuth, async (req, res) => {
  try {
    // Only allow admins or specific roles to access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const verifiedUsers = await User.find({ 
      isVerified: true,
      verificationStatus: 'verified'
    }).select('name email phone role isVerified verificationMethod verifiedAt createdAt');

    res.json({
      count: verifiedUsers.length,
      users: verifiedUsers
    });
  } catch (err) {
    console.error('Error in GET /api/verification/verified-users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get verification statistics
router.get('/stats', firebaseAuth, async (req, res) => {
  try {
    // Only allow admins or specific roles to access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { 
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } 
          },
          pendingUsers: { 
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'pending'] }, 1, 0] } 
          },
          rejectedUsers: { 
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'rejected'] }, 1, 0] } 
          },
          digilockerVerified: { 
            $sum: { $cond: [{ $eq: ['$verificationMethod', 'digilocker'] }, 1, 0] } 
          }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalUsers: 0,
        verifiedUsers: 0,
        pendingUsers: 0,
        rejectedUsers: 0,
        digilockerVerified: 0
      }
    });
  } catch (err) {
    console.error('Error in GET /api/verification/stats:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update verification status (admin only)
router.patch('/:userId/status', firebaseAuth, async (req, res) => {
  try {
    // Only allow admins to update verification status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { verificationStatus, reason } = req.body;
    
    if (!verificationStatus || !['pending', 'verified', 'rejected', 'expired'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const updateData = {
      verificationStatus,
      isVerified: verificationStatus === 'verified'
    };

    if (verificationStatus === 'verified') {
      updateData.verifiedAt = new Date();
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-firebaseUid -password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Verification status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (err) {
    console.error('Error in PATCH /api/verification/:userId/status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Export verification data (admin only)
router.get('/export', firebaseAuth, async (req, res) => {
  try {
    // Only allow admins to export verification data
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const verifiedUsers = await User.find({ 
      isVerified: true 
    }).select('name email phone role verificationMethod verifiedAt createdAt');

    // Format data for export
    const exportData = verifiedUsers.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verificationMethod: user.verificationMethod,
      verifiedAt: user.verifiedAt,
      createdAt: user.createdAt
    }));

    res.json({
      exportDate: new Date(),
      totalRecords: exportData.length,
      data: exportData
    });
  } catch (err) {
    console.error('Error in GET /api/verification/export:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
