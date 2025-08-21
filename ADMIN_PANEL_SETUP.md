# Admin Panel Integration Setup Guide

This guide will help you connect your admin panel to your main People app.

## 🚀 Quick Start

### 1. Create Admin User
```bash
cd api
node scripts/createAdmin.js
```

### 2. Start Your Backend Server
```bash
cd api
npm start
```

### 3. Update Admin Panel Configuration
In your admin panel's `config.js`, update the API_BASE_URL:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api', // or your production URL
    // ... rest of config
};
```

## 📁 File Structure Created

```
api/
├── models/
│   ├── Admin.js              # Admin user model
│   └── Verification.js       # Document verification model
├── controllers/
│   └── adminController.js    # Admin panel logic
├── routes/
│   └── admin.js              # Admin API routes
├── middleware/
│   └── auth.js               # Admin authentication
├── scripts/
│   └── createAdmin.js        # Admin user creation script
├── config.js                 # Configuration file
└── public/
    └── documents/            # Document upload directory
```

## 🔧 API Endpoints Available

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/verify-token` - Verify admin token

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Verification Management
- `GET /api/admin/verifications` - Get all verifications
- `GET /api/admin/verifications/pending` - Get pending verifications
- `GET /api/admin/verifications/approved` - Get approved verifications
- `GET /api/admin/verifications/rejected` - Get rejected verifications
- `GET /api/admin/verifications/:id` - Get specific verification
- `POST /api/admin/verifications/:id/approve` - Approve verification
- `POST /api/admin/verifications/:id/reject` - Reject verification

### Document Management
- `POST /api/admin/upload/document` - Upload document
- `GET /api/admin/documents/:id` - Get document

## 📱 Mobile App Integration

### Document Upload Routes (for mobile app)
- `PATCH /api/users/:id/documents/:documentType/:side` - Upload document
- `POST /api/users/:id/submit-verification` - Submit for verification
- `GET /api/users/:id/documents` - Get user documents

### Example Usage in Mobile App

```javascript
// Upload Aadhaar front
const formData = new FormData();
formData.append('document', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'aadhaar_front.jpg'
});

const response = await fetch(`${API_BASE_URL}/users/${userId}/documents/aadhaar/front`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});

// Submit for verification
const submitResponse = await fetch(`${API_BASE_URL}/users/${userId}/submit-verification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔐 Security Features

### Admin Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration (24 hours)

### Document Security
- File type validation
- File size limits (5MB)
- Secure file naming
- Access control (users can only upload their own documents)

### API Protection
- Firebase authentication for user routes
- Admin authentication for admin routes
- CORS configuration
- Input validation

## 📊 Database Schema

### Admin Model
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String (unique),
  role: String (default: 'admin'),
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Verification Model
```javascript
{
  userId: ObjectId (ref: User),
  userName: String,
  userEmail: String,
  userPhone: String,
  documentType: String (enum: ['aadhar', 'pan', 'driving']),
  documents: {
    front: String,
    back: String
  },
  status: String (enum: ['pending', 'approved', 'rejected']),
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: Admin),
  comments: String,
  timestamps: true
}
```

### Updated User Model
Added document fields:
```javascript
documents: {
  aadhaar: {
    front: String,
    back: String,
    uploadedAt: Date
  },
  pan: {
    front: String,
    back: String,
    uploadedAt: Date
  },
  drivingLicense: {
    front: String,
    back: String,
    uploadedAt: Date
  }
}
```

## 🌐 CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:5000` (admin panel)
- `http://localhost:3000` (main app)
- `https://your-admin-domain.com` (production)

## 🔧 Environment Variables

Make sure your `.env` file includes:
```env
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/people-app
PORT=5000
API_BASE_URL=http://localhost:5000/api
```

## 🚀 Testing the Integration

### 1. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Test Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Test Verification Endpoints
```bash
curl -X GET http://localhost:5000/api/admin/verifications/pending \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check CORS configuration in app.js
   - Verify admin panel URL is in allowed origins

2. **Authentication Errors**
   - Ensure JWT_SECRET is set in environment
   - Check admin user exists in database
   - Verify token format in Authorization header

3. **File Upload Issues**
   - Check documents directory exists
   - Verify file size limits
   - Ensure correct file types

4. **Database Connection**
   - Check MongoDB connection string
   - Verify database is running
   - Check network connectivity

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
1. Check browser console for errors
2. Verify API endpoints are working
3. Ensure database connections are active
4. Test with Postman or similar tool
5. Check server logs for detailed error messages

---

**Note**: This setup assumes you're using Node.js/Express for your main app. Adjust the code according to your actual tech stack.
