const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Verification = require('../models/Verification');
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

// GET /api/verifications/initial - Get initial verifications
router.get('/initial', firebaseAuth, async (req, res) => {
    try {
        const verifications = await Verification.find({ type: 'initial', status: 'pending' })
            .populate('userId', 'name phone email')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            verifications: verifications
        });
    } catch (error) {
        console.error('Error fetching initial verifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch initial verifications',
            error: error.message
        });
    }
});

// GET /api/verifications/resubmissions - Get resubmission verifications
router.get('/resubmissions', firebaseAuth, async (req, res) => {
    try {
        const verifications = await Verification.find({ type: 'resubmission', status: 'pending' })
            .populate('userId', 'name phone email')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            verifications: verifications
        });
    } catch (error) {
        console.error('Error fetching resubmission verifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resubmission verifications',
            error: error.message
        });
    }
});

// GET /api/verifications/:id - Get single verification
router.get('/:id', firebaseAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

        res.json({
            success: true,
            verification: verification
        });
    } catch (error) {
        console.error('Error fetching verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch verification',
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
        console.log('🔍 Looking for user with phone:', phone);
        console.log('🔍 User found:', user ? user._id : 'No user found');
        console.log('🔍 createUser flag:', req.body.createUser);
        
        if (!user) {
            // Check if we should create a new user
            if (req.body.createUser) {
                console.log('✅ Creating new user for phone:', phone);
                
                // Create new user
                const userData = {
                    phone: phone,
                    role: req.body.role || 'freelancer',
                    name: `${firstName} ${lastName}`,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    dateOfBirth: dob,
                    gender: gender,
                    address: address,
                    pincode: pincode,
                    verificationStatus: verificationStatus || 'pending',
                    isVerified: isVerified || false,
                    submittedAt: submittedAt || new Date()
                };
                
                user = new User(userData);
                await user.save();
                console.log('✅ Created new user:', user._id);
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }
        }

        // Determine if this is a resubmission
        const isResubmission = user.verificationStatus === 'rejected' || user.resubmissionCount > 0;
        
        // Create a new verification entry
        const verificationData = {
            userId: user._id,
            type: isResubmission ? 'resubmission' : 'initial',
            status: 'pending',
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            dateOfBirth: dob,
            gender: gender,
            address: address,
            pincode: pincode,
            deliveryWork: req.body.deliveryWork || false
        };

        // Add documents if provided
        if (documents) {
            console.log('Processing documents in submit route:', documents);
            
            // Initialize documents structure
            verificationData.documents = {
                aadhaar: { front: null, back: null },
                pan: { front: null },
                drivingLicense: { front: null, back: null }
            };
            
            // Map document fields to the correct structure
            if (documents.profilePhoto) {
                verificationData.profileImage = documents.profilePhoto;
                console.log('Profile photo saved:', documents.profilePhoto);
            }
            if (documents.aadharFront) {
                verificationData.documents.aadhaar.front = documents.aadharFront;
                console.log('Aadhar front saved:', documents.aadharFront);
            }
            if (documents.aadharBack) {
                verificationData.documents.aadhaar.back = documents.aadharBack;
                console.log('Aadhar back saved:', documents.aadharBack);
            }
            if (documents.panCard) {
                verificationData.documents.pan.front = documents.panCard;
                console.log('PAN card saved:', documents.panCard);
            }
            if (documents.drivingLicenseFront) {
                verificationData.documents.drivingLicense.front = documents.drivingLicenseFront;
                console.log('Driving license front saved:', documents.drivingLicenseFront);
            }
            if (documents.drivingLicenseBack) {
                verificationData.documents.drivingLicense.back = documents.drivingLicenseBack;
                console.log('Driving license back saved:', documents.drivingLicenseBack);
            }
            
            console.log('Final documents structure:', verificationData.documents);
        }

        // Create the verification entry
        const verification = new Verification(verificationData);
        await verification.save();

        // Update user status to pending (but don't update documents yet)
        const userUpdateData = {
            verificationStatus: 'pending',
            isVerified: false
        };

        if (isResubmission) {
            userUpdateData.resubmissionCount = (user.resubmissionCount || 0) + 1;
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            userUpdateData,
            { new: true, runValidators: true }
        );

        console.log(`${isResubmission ? 'Re-verification' : 'Verification'} submitted for user:`, updatedUser._id);

        res.json({
            success: true,
            message: isResubmission ? 'Re-verification submitted successfully' : 'Verification submitted successfully',
            user: updatedUser,
            verificationId: verification._id
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

// POST /api/verifications/:id/approve - Approve verification
router.post('/:id/approve', firebaseAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminComments } = req.body;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

        // Update verification status
        verification.status = 'approved';
        verification.adminComments = adminComments;
        verification.reviewedAt = new Date();
        await verification.save();

        // Update user status and documents
        const userUpdateData = {
            verificationStatus: 'approved',
            isVerified: true,
            adminComments: adminComments
        };

        // Copy documents from verification to user
        if (verification.documents) {
            userUpdateData.documents = verification.documents;
        }
        if (verification.profileImage) {
            userUpdateData.profileImage = verification.profileImage;
        }

        await User.findByIdAndUpdate(verification.userId, userUpdateData);

        res.json({
            success: true,
            message: 'Verification approved successfully'
        });
    } catch (error) {
        console.error('Error approving verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve verification',
            error: error.message
        });
    }
});

// POST /api/verifications/:id/reject - Reject verification
router.post('/:id/reject', firebaseAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminComments } = req.body;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

        // Update verification status
        verification.status = 'rejected';
        verification.adminComments = adminComments;
        verification.reviewedAt = new Date();
        await verification.save();

        // Update user status
        await User.findByIdAndUpdate(verification.userId, {
            verificationStatus: 'rejected',
            isVerified: false,
            adminComments: adminComments
        });

        res.json({
            success: true,
            message: 'Verification rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject verification',
            error: error.message
        });
    }
});

// DELETE /api/verifications/:id - Delete verification
router.delete('/:id', firebaseAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

        // Delete the verification
        await Verification.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Verification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete verification',
            error: error.message
        });
    }
});

module.exports = router;
