const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test route to check if admin routes are working
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes are working' });
});

// Update your existing admin middleware to handle Firebase tokens
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('firebase-token');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        // Check if it's an admin token
        if (token.startsWith('admin-firebase-token-')) {
            req.user = { username: 'admin', role: 'admin' };
            next();
        } else {
            // Handle regular Firebase token verification here
            // You'll need to verify the Firebase token with your Firebase admin SDK
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Test verification endpoints (after authenticateAdmin is defined)
router.get('/verifications-test', authenticateAdmin, (req, res) => {
    res.json({ message: 'Admin verification endpoints are accessible' });
});

// Firebase Admin Authentication
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin authentication for Firebase
        if (username === 'admin' && password === 'admin123') {
            // Generate a Firebase-compatible admin token
            const adminToken = 'admin-firebase-token-' + Date.now();
            
            res.json({
                success: true,
                token: adminToken,
                user: {
                    username: 'admin',
                    role: 'admin',
                    uid: 'admin-uid'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get Users Endpoint (adapted for User model)
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const { verificationStatus, deleteUserId, phone } = req.query;
        
        // Handle delete action via query parameter
        if (deleteUserId) {
            console.log('Deleting user via query parameter:', deleteUserId);
            
            // Import the admin controller
            const adminController = require('../controllers/adminController');
            
            // Create a mock request object for the delete method
            const mockReq = {
                params: { id: deleteUserId },
                status: (code) => ({
                    json: (data) => {
                        if (code === 404) {
                            return res.status(404).json(data);
                        } else if (code === 500) {
                            return res.status(500).json(data);
                        }
                        return res.json(data);
                    }
                })
            };
            
            // Use the comprehensive delete method
            await adminController.deleteUser(mockReq, res);
            return; // Exit early
        }
        
                // Handle phone number search
        if (phone) {
            console.log('Searching user by phone number:', phone);
            const user = await User.findOne({ phone: phone });
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this phone number'
                });
            }
            
            return res.json({
                success: true,
                user: user
            });
        }
        
        let query = {};
        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }
        
        // Get all users from your database (not just freelancers)
        const users = await User.find(query)
            .select('name email phone verificationStatus isVerified createdAt profileImage documents address pincode dateOfBirth gender firstName lastName freelancerId resubmissionCount role')
            .sort({ createdAt: -1 });
        
        console.log(`🔍 Admin users endpoint: Found ${users.length} users`);
        console.log('📋 Users:', users.map(u => ({ id: u._id, name: u.name, status: u.verificationStatus, role: u.role })));
        
        // Debug: Log the first user with verification data
        if (users.length > 0) {
            const firstUser = users[0];
            console.log('🔍 First user before verification lookup:', firstUser.name);
        }
        
        // Get the most recent verification data for each user
        const Verification = require('../models/Verification');
        const usersWithVerification = await Promise.all(users.map(async (user) => {
            try {
                const latestVerification = await Verification.findOne({ userId: user._id })
                    .sort({ submittedAt: -1 });
                
                // If there's verification data, use it to update the display information
                if (latestVerification) {
                    console.log(`🔍 User ${user.name} has verification data:`, latestVerification.name);
                    return {
                        ...user.toObject(),
                        displayName: latestVerification.name || user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                        displayDob: latestVerification.dateOfBirth || user.dob || user.dateOfBirth,
                        displayGender: latestVerification.gender || user.gender,
                        displayAddress: latestVerification.address || user.address,
                        displayPincode: latestVerification.pincode || user.pincode,
                        latestVerification: latestVerification
                    };
                } else {
                    console.log(`🔍 User ${user.name} has no verification data, using user data`);
                    return {
                        ...user.toObject(),
                        displayName: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                        displayDob: user.dob || user.dateOfBirth,
                        displayGender: user.gender,
                        displayAddress: user.address,
                        displayPincode: user.pincode
                    };
                }
            } catch (error) {
                console.log('Error fetching verification for user:', user._id, error.message);
                return {
                    ...user.toObject(),
                    displayName: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    displayDob: user.dob || user.dateOfBirth,
                    displayGender: user.gender,
                    displayAddress: user.address,
                    displayPincode: user.pincode
                };
            }
        }));
        
        res.json({
            success: true,
            verifications: usersWithVerification // Admin panel expects this structure
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get Single User Endpoint
router.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name email phone verificationStatus isVerified createdAt profileImage documents address pincode dateOfBirth gender firstName lastName freelancerId resubmissionCount');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Also fetch verification data for this user
        let verification = null;
        try {
            const Verification = require('../models/Verification');
            verification = await Verification.findOne({ userId: req.params.id })
                .sort({ submittedAt: -1 });
        } catch (verificationError) {
            console.log('No verification data found for user:', req.params.id);
        }
        
        res.json({
            user: user,
            verification: verification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Comprehensive Delete User Endpoint
router.get('/delete-user/:id', authenticateAdmin, async (req, res) => {
    console.log('DELETE USER called with ID:', req.params.id);
    
    // Import the admin controller
    const adminController = require('../controllers/adminController');
    
    // Use the comprehensive delete method
    await adminController.deleteUser(req, res);
});

// Temporary endpoint to assign freelancer ID to verified users
router.get('/assign-freelancer-id', authenticateAdmin, async (req, res) => {
  try {
    const adminController = require('../controllers/adminController');
    
    // Find the most recently verified freelancer without a freelancerId
    const user = await User.findOne({ 
      role: 'freelancer', 
      isVerified: true,
      freelancerId: { $exists: false }
    }).sort({ verifiedAt: -1 });
    
    if (!user) {
      // Check if any verified freelancer exists
      const verifiedUser = await User.findOne({ 
        role: 'freelancer', 
        isVerified: true 
      }).sort({ verifiedAt: -1 });
      
      if (verifiedUser) {
        return res.json({
          success: true,
          message: 'User already has freelancerId',
          user: {
            name: verifiedUser.name,
            phone: verifiedUser.phone,
            freelancerId: verifiedUser.freelancerId
          }
        });
      } else {
        return res.json({
          success: false,
          message: 'No verified freelancers found'
        });
      }
    }
    
    // Generate and assign freelancer ID
    const freelancerId = await adminController.generateFreelancerId();
    
    // Update the user
    await User.findByIdAndUpdate(user._id, {
      freelancerId: freelancerId
    });
    
    res.json({
      success: true,
      message: 'Freelancer ID assigned successfully',
      user: {
        name: user.name,
        phone: user.phone,
        freelancerId: freelancerId
      }
    });
  } catch (error) {
    console.error('Assign freelancer ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign freelancer ID'
    });
  }
});

// Document proxy endpoint to handle file:// URLs
router.get('/document-proxy', authenticateAdmin, async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }
        
        console.log('Document proxy request for URL:', url);
        
        // For file:// URLs, we'll return a placeholder image
        if (url.startsWith('file://')) {
            // Return a placeholder image or error message
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(`
                <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="150" fill="#f0f0f0"/>
                    <text x="100" y="75" font-family="Arial" font-size="12" fill="#666" text-anchor="middle">
                        Document not accessible
                    </text>
                    <text x="100" y="95" font-family="Arial" font-size="10" fill="#999" text-anchor="middle">
                        ${url.split('/').pop()}
                    </text>
                </svg>
            `);
        } else {
            // For other URLs, try to proxy them
            const response = await fetch(url);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
                res.send(Buffer.from(buffer));
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        }
    } catch (error) {
        console.error('Document proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load document'
        });
    }
});

// Update Verification Status Endpoint (adapted for User model)
router.patch('/users/:id/verification-status', authenticateAdmin, async (req, res) => {
    try {
        const { isVerified, verificationStatus, verifiedAt, rejectedAt, adminComments, action } = req.body;
        
        console.log('Verification status update request:', JSON.stringify(req.body, null, 2));
        console.log('Action field:', action);
        console.log('Action type:', typeof action);
        console.log('Action === "delete":', action === 'delete');
        
        // Handle delete action
        if (action === 'delete') {
            console.log('Deleting user:', req.params.id);
            const user = await User.findByIdAndDelete(req.params.id);
            
            if (!user) {
                console.log('User not found for deletion:', req.params.id);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            console.log('User deleted successfully:', req.params.id);
            return res.json({
                success: true,
                message: 'User deleted successfully'
            });
        }
        
        // Handle verification status update
        const updateData = {
            isVerified,
            verificationStatus,
            adminComments
        };
        
        if (verificationStatus === 'approved') {
            updateData.verifiedAt = verifiedAt || new Date();
            
            // Generate unique Freelancer ID for approved users
            const generateFreelancerId = async () => {
                let freelancerId;
                let isUnique = false;
                
                while (!isUnique) {
                    freelancerId = Math.floor(Math.random() * 900000000) + 10000; // 5-9 digits
                    freelancerId = freelancerId.toString();
                    
                    const existingUser = await User.findOne({ freelancerId });
                    if (!existingUser) {
                        isUnique = true;
                    }
                }
                
                return freelancerId;
            };
            
            // Generate and assign Freelancer ID
            const freelancerId = await generateFreelancerId();
            updateData.freelancerId = freelancerId;
            
            console.log(`Generated Freelancer ID: ${freelancerId} for user: ${req.params.id}`);
        } else if (verificationStatus === 'rejected') {
            updateData.rejectedAt = rejectedAt || new Date();
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            verification: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update verification status'
        });
    }
});

// Resubmit Verification Endpoint
router.post('/users/:id/resubmit-verification', authenticateAdmin, async (req, res) => {
    try {
        console.log('Resubmit verification request for user:', req.params.id);
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Reset verification status to pending
        const updateData = {
            verificationStatus: 'pending',
            isVerified: false,
            rejectedAt: null,
            adminComments: null
        };
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        console.log('User verification status reset to pending:', req.params.id);
        
        res.json({
            success: true,
            message: 'Verification resubmitted successfully',
            verification: updatedUser
        });
    } catch (error) {
        console.error('Error resubmitting verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resubmit verification'
        });
    }
});

// Get Initial Verifications (Admin endpoint)
router.get('/verifications/initial', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔍 Admin endpoint: /verifications/initial called');
        const Verification = require('../models/Verification');
        console.log('✅ Verification model loaded');
        
        const verifications = await Verification.find({ type: 'initial', status: 'pending' })
            .populate('userId', 'name phone email')
            .sort({ submittedAt: -1 });

        console.log(`📋 Found ${verifications.length} initial verifications`);
        res.json({
            success: true,
            verifications: verifications
        });
    } catch (error) {
        console.error('❌ Error fetching initial verifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch initial verifications',
            error: error.message
        });
    }
});

// Get Resubmission Verifications (Admin endpoint)
router.get('/verifications/resubmissions', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔍 Admin endpoint: /verifications/resubmissions called');
        const Verification = require('../models/Verification');
        console.log('✅ Verification model loaded');
        
        const verifications = await Verification.find({ type: 'resubmission', status: 'pending' })
            .populate('userId', 'name phone email')
            .sort({ submittedAt: -1 });

        console.log(`📋 Found ${verifications.length} resubmission verifications`);
        res.json({
            success: true,
            verifications: verifications
        });
    } catch (error) {
        console.error('❌ Error fetching resubmission verifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resubmission verifications',
            error: error.message
        });
    }
});

// Get Single Verification (Admin endpoint)
router.get('/verifications/:id', authenticateAdmin, async (req, res) => {
    try {
        const Verification = require('../models/Verification');
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

// Approve Verification (Admin endpoint)
router.post('/verifications/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const Verification = require('../models/Verification');
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

        // Update user with verification data
        const user = await User.findById(verification.userId);
        if (user) {
            // Copy verification data to user
            user.name = verification.name;
            user.firstName = verification.firstName;
            user.lastName = verification.lastName;
            user.email = verification.email;
            user.dateOfBirth = verification.dateOfBirth;
            user.gender = verification.gender;
            user.address = verification.address;
            user.pincode = verification.pincode;
            user.profileImage = verification.profileImage;
            user.documents = verification.documents;
            user.deliveryWork = verification.deliveryWork;
            user.verificationStatus = 'approved';
            user.isVerified = true;
            user.verifiedAt = new Date();
            user.adminComments = adminComments;

            // Generate Freelancer ID if not exists
            if (!user.freelancerId) {
                const generateFreelancerId = async () => {
                    let freelancerId;
                    let isUnique = false;
                    
                    while (!isUnique) {
                        freelancerId = Math.floor(Math.random() * 900000000) + 10000; // 5-9 digits
                        freelancerId = freelancerId.toString();
                        
                        const existingUser = await User.findOne({ freelancerId });
                        if (!existingUser) {
                            isUnique = true;
                        }
                    }
                    
                    return freelancerId;
                };
                
                user.freelancerId = await generateFreelancerId();
            }

            await user.save();
        }

        res.json({
            success: true,
            message: 'Verification approved successfully',
            verification: verification
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

// Reject Verification (Admin endpoint)
router.post('/verifications/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const Verification = require('../models/Verification');
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
        const user = await User.findById(verification.userId);
        if (user) {
            user.verificationStatus = 'rejected';
            user.isVerified = false;
            user.adminComments = adminComments;
            await user.save();
        }

        res.json({
            success: true,
            message: 'Verification rejected successfully',
            verification: verification
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

// Delete Verification (Admin endpoint)
router.delete('/verifications/:id', authenticateAdmin, async (req, res) => {
    try {
        const Verification = require('../models/Verification');
        const { id } = req.params;

        const verification = await Verification.findByIdAndDelete(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

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

// Get verification data for a specific user
router.get('/verifications/user/:userId', authenticateAdmin, async (req, res) => {
    try {
        const Verification = require('../models/Verification');
        const { userId } = req.params;

        // Find the most recent verification for this user
        const verification = await Verification.findOne({ userId: userId })
            .sort({ submittedAt: -1 });

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'No verification found for this user'
            });
        }

        res.json({
            success: true,
            verification: verification
        });
    } catch (error) {
        console.error('Error fetching user verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user verification',
            error: error.message
        });
    }
});

// Additional routes can be added here as needed

module.exports = router;
