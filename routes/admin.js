const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
router.delete('/delete-user/:id', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
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
        const { isVerified, verificationStatus, verifiedAt, rejectedAt, adminComments } = req.body;
        
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

// Keep existing routes
router.post('/logout', auth.verifyAdmin, adminController.logout);
router.get('/verify-token', auth.verifyAdmin, adminController.verifyToken);

// Dashboard routes
router.get('/dashboard/stats', auth.verifyAdmin, adminController.getDashboardStats);

// Verification routes (existing)
router.get('/verifications', auth.verifyAdmin, adminController.getAllVerifications);
router.get('/verifications/pending', auth.verifyAdmin, adminController.getPendingVerifications);
router.get('/verifications/approved', auth.verifyAdmin, adminController.getApprovedVerifications);
router.get('/verifications/rejected', auth.verifyAdmin, adminController.getRejectedVerifications);
router.get('/verifications/:id', auth.verifyAdmin, adminController.getVerificationById);
router.post('/verifications/:id/approve', auth.verifyAdmin, adminController.approveVerification);
router.post('/verifications/:id/reject', auth.verifyAdmin, adminController.rejectVerification);

// File upload routes
router.post('/upload/document', auth.verifyAdmin, adminController.uploadDocument);
router.get('/documents/:id', auth.verifyAdmin, adminController.getDocument);

module.exports = router;
