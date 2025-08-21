# Admin Panel Setup Guide

This guide will help you connect the admin panel to your main People app.

## 📁 File Structure

```
Your-Main-App/
├── src/
│   ├── routes/
│   │   └── admin.js          # Admin API routes
│   ├── controllers/
│   │   └── adminController.js # Admin logic
│   ├── models/
│   │   └── Verification.js   # Verification model
│   └── middleware/
│       └── auth.js           # Authentication middleware

Admin-Panel/
├── index.html
├── admin-styles.css
├── admin-script.js
├── config.js                 # API configuration
└── SETUP_GUIDE.md
```

## 🔧 Step 1: Configure Admin Panel

### Update `config.js`
Edit the `API_BASE_URL` in `admin/config.js`:

```javascript
const CONFIG = {
    // Update this to your main app's API URL
    API_BASE_URL: 'http://localhost:3000/api', // or your production URL
    
    // ... rest of config
};
```

## 🚀 Step 2: Add API Routes to Your Main App

### Create Admin Routes (`src/routes/admin.js`)

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Authentication routes
router.post('/login', adminController.login);
router.post('/logout', auth.verifyAdmin, adminController.logout);
router.get('/verify-token', auth.verifyAdmin, adminController.verifyToken);

// Verification routes
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
```

### Create Admin Controller (`src/controllers/adminController.js`)

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Verification = require('../models/Verification');
const Admin = require('../models/Admin');

class AdminController {
    // Authentication
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Find admin user
            const admin = await Admin.findOne({ username });
            if (!admin) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            // Verify password
            const isValidPassword = await bcrypt.compare(password, admin.password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { id: admin._id, username: admin.username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: {
                    id: admin._id,
                    username: admin.username,
                    role: 'admin'
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Login failed' 
            });
        }
    }
    
    async logout(req, res) {
        // In a real app, you might want to blacklist the token
        res.json({ success: true, message: 'Logged out successfully' });
    }
    
    async verifyToken(req, res) {
        res.json({ success: true, user: req.user });
    }
    
    // Verification management
    async getAllVerifications(req, res) {
        try {
            const verifications = await Verification.find()
                .sort({ createdAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch verifications' 
            });
        }
    }
    
    async getPendingVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'pending' })
                .sort({ createdAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch pending verifications' 
            });
        }
    }
    
    async getApprovedVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'approved' })
                .sort({ reviewedAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch approved verifications' 
            });
        }
    }
    
    async getRejectedVerifications(req, res) {
        try {
            const verifications = await Verification.find({ status: 'rejected' })
                .sort({ reviewedAt: -1 });
            
            res.json({ success: true, verifications });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch rejected verifications' 
            });
        }
    }
    
    async getVerificationById(req, res) {
        try {
            const verification = await Verification.findById(req.params.id);
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            res.json({ success: true, verification });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch verification' 
            });
        }
    }
    
    async approveVerification(req, res) {
        try {
            const { comments } = req.body;
            const verification = await Verification.findById(req.params.id);
            
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            verification.status = 'approved';
            verification.reviewedAt = new Date();
            verification.reviewedBy = req.user.id;
            verification.comments = comments;
            
            await verification.save();
            
            res.json({ success: true, verification });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to approve verification' 
            });
        }
    }
    
    async rejectVerification(req, res) {
        try {
            const { comments } = req.body;
            const verification = await Verification.findById(req.params.id);
            
            if (!verification) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Verification not found' 
                });
            }
            
            if (!comments) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Comments are required for rejection' 
                });
            }
            
            verification.status = 'rejected';
            verification.reviewedAt = new Date();
            verification.reviewedBy = req.user.id;
            verification.comments = comments;
            
            await verification.save();
            
            res.json({ success: true, verification });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to reject verification' 
            });
        }
    }
    
    // File upload
    async uploadDocument(req, res) {
        try {
            // Handle file upload logic here
            // You might want to use multer for file handling
            res.json({ success: true, documentId: 'uploaded-document-id' });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload document' 
            });
        }
    }
    
    async getDocument(req, res) {
        try {
            // Serve document file
            res.sendFile(`path/to/document/${req.params.id}`);
        } catch (error) {
            res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }
    }
}

module.exports = new AdminController();
```

### Create Authentication Middleware (`src/middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');

class Auth {
    verifyAdmin(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid token.' 
            });
        }
    }
}

module.exports = new Auth();
```

### Create Verification Model (`src/models/Verification.js`)

```javascript
const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        enum: ['aadhar', 'pan', 'driving'],
        required: true
    },
    documents: {
        front: String,
        back: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    comments: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Verification', verificationSchema);
```

### Create Admin Model (`src/models/Admin.js`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Admin', adminSchema);
```

## 🔗 Step 3: Connect Routes in Your Main App

### Add to your main app (`app.js` or `server.js`)

```javascript
const express = require('express');
const app = express();
const adminRoutes = require('./src/routes/admin');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', adminRoutes);

// ... rest of your app configuration
```

## 🔐 Step 4: Create Admin User

### Create a script to add admin user (`scripts/createAdmin.js`)

```javascript
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const admin = new Admin({
            username: 'admin',
            password: 'admin123',
            email: 'admin@people.com'
        });
        
        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create admin:', error);
        process.exit(1);
    }
}

createAdmin();
```

Run this script:
```bash
node scripts/createAdmin.js
```

## 🌐 Step 5: CORS Configuration

If your admin panel is on a different domain, add CORS:

```javascript
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:5000', 'https://your-admin-domain.com'],
    credentials: true
}));
```

## 🚀 Step 6: Environment Variables

Create `.env` file in your main app:

```env
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/people-app
PORT=3000
```

## 📱 Step 7: Test the Connection

1. Start your main app server
2. Open the admin panel in browser
3. Try logging in with admin/admin123
4. Check browser console for any errors

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure CORS is properly configured
2. **API URL**: Verify the API_BASE_URL in config.js
3. **JWT Secret**: Ensure JWT_SECRET is set in environment
4. **Database**: Check MongoDB connection
5. **File Uploads**: Implement proper file handling with multer

### Debug Mode:

Enable debug logging in your main app:

```javascript
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
```

## 📞 Support

If you encounter issues:
- Check browser console for errors
- Verify API endpoints are working
- Ensure database connections are active
- Test with Postman or similar tool

---

**Note**: This setup assumes you're using Node.js/Express for your main app. Adjust the code according to your actual tech stack.
