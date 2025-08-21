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
        const { verificationStatus } = req.query;
        
        let query = { role: 'freelancer' };
        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }
        
        // Get users from your database
        const users = await User.find(query)
            .select('name email phone verificationStatus isVerified createdAt profileImage documents address city state pincode dateOfBirth gender firstName lastName')
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
            .select('name email phone verificationStatus isVerified createdAt profileImage documents address city state pincode dateOfBirth gender firstName lastName');
        
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

// Delete User Endpoint
router.post('/delete-user/:id', authenticateAdmin, async (req, res) => {
    console.log('POST /delete-user/:id called with ID:', req.params.id);
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            console.log('User not found for deletion:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('User deleted successfully:', req.params.id);
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// Update Verification Status Endpoint (adapted for User model)
router.patch('/users/:id/verification-status', authenticateAdmin, async (req, res) => {
    try {
        const { isVerified, verificationStatus, verifiedAt, rejectedAt, adminComments, action } = req.body;
        
        // Handle delete action
        if (action === 'delete') {
            const user = await User.findByIdAndDelete(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
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

// Additional routes can be added here as needed

module.exports = router;
