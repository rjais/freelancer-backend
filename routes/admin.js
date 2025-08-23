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
        
        let query = { role: 'freelancer' };
        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }
        
        // Get users from your database
        const users = await User.find(query)
            .select('name email phone verificationStatus isVerified createdAt profileImage documents address pincode dateOfBirth gender firstName lastName freelancerId resubmissionCount')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            verifications: users // Admin panel expects this structure
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
        
        res.json(user);
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

// Additional routes can be added here as needed

module.exports = router;
