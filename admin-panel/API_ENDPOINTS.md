# API Endpoints Needed for Admin Panel

Add these endpoints to your main app to make the admin panel work with your actual API.

## 🔐 **1. Admin Authentication Endpoint**

### **POST /api/admin/login**
```javascript
// Add this to your main app
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin authentication (you can enhance this)
        if (username === 'admin' && password === 'admin123') {
            // Generate JWT token
            const token = jwt.sign(
                { username: 'admin', role: 'admin' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: {
                    username: 'admin',
                    role: 'admin'
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
```

## 👥 **2. Get Users with Verification Status**

### **GET /api/users**
```javascript
// Add this to your main app
app.get('/api/users', async (req, res) => {
    try {
        const { verificationStatus } = req.query;
        
        let query = {};
        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }
        
        // Get users from your database
        const users = await User.find(query)
            .select('name email phone verificationStatus isVerified createdAt profilePhoto aadharFront aadharBack panCard drivingLicenseFront drivingLicenseBack')
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
```

## 🔍 **3. Get Single User Details**

### **GET /api/users/:id**
```javascript
// Add this to your main app
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name email phone verificationStatus isVerified createdAt profilePhoto aadharFront aadharBack panCard drivingLicenseFront drivingLicenseBack');
        
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
```

## ✅ **4. Update Verification Status**

### **PATCH /api/users/:id/verification-status**
```javascript
// Add this to your main app
app.patch('/api/users/:id/verification-status', async (req, res) => {
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
```

## 🔒 **5. Authentication Middleware**

### **Add this middleware to protect admin routes**
```javascript
// Add this to your main app
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Use middleware for protected routes
app.get('/api/users', authenticateAdmin, async (req, res) => {
    // ... your code
});

app.get('/api/users/:id', authenticateAdmin, async (req, res) => {
    // ... your code
});

app.patch('/api/users/:id/verification-status', authenticateAdmin, async (req, res) => {
    // ... your code
});
```

## 📝 **6. Complete Example Integration**

### **Add this to your main app's server file:**
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(express.json());

// Admin authentication
app.post('/api/admin/login', async (req, res) => {
    // ... admin login code from above
});

// Protected admin routes
app.get('/api/users', authenticateAdmin, async (req, res) => {
    // ... get users code from above
});

app.get('/api/users/:id', authenticateAdmin, async (req, res) => {
    // ... get user code from above
});

app.patch('/api/users/:id/verification-status', authenticateAdmin, async (req, res) => {
    // ... update verification code from above
});

// Serve admin panel
app.use('/admin-panel', express.static(path.join(__dirname, 'admin')));
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
```

## 🚀 **7. Test the Integration**

1. **Add these endpoints** to your main app
2. **Restart your server**
3. **Access admin panel**: `http://localhost:5000/admin-panel/`
4. **Login**: username: `admin`, password: `admin123`
5. **Test approval/rejection** of your pending verification

## 📊 **Expected Data Flow:**

```
User submits verification → Database stores user with verificationStatus: "pending"
Admin panel fetches users → API returns users with pending status
Admin reviews documents → API fetches user details with documents
Admin approves/rejects → API updates user verificationStatus and isVerified
User sees updated status → App shows "Complete profile" instead of "Under Review"
```

## 🔧 **Customization:**

- **Change admin credentials** in the login endpoint
- **Add more user fields** to the API responses
- **Enhance security** with proper admin user management
- **Add logging** for admin actions
- **Add email notifications** when verification status changes

Your admin panel is now ready to work with your actual app! 🎉
