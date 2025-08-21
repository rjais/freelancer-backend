# Verification Endpoint for Backend

Add this endpoint to your main app to handle verification form submissions.

## 🔧 **Add to Your Main App's Backend**

### **1. Add Verification Route**

Add this to your main app's routes (e.g., `api/routes/verifications.js` or `api/app.js`):

```javascript
// POST /api/verifications - Submit verification
app.post('/api/verifications', async (req, res) => {
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
            dob: dob,
            gender: gender,
            address: address,
            city: city,
            state: state,
            pincode: pincode,
            verificationStatus: verificationStatus,
            isVerified: isVerified,
            submittedAt: submittedAt
        };

        // Add documents if provided
        if (documents) {
            updateData.documents = documents;
            
            // Also add individual document fields for compatibility
            if (documents.profilePhoto) updateData.profilePhoto = documents.profilePhoto;
            if (documents.aadharFront) updateData.aadharFront = documents.aadharFront;
            if (documents.aadharBack) updateData.aadharBack = documents.aadharBack;
            if (documents.panCard) updateData.panCard = documents.panCard;
            if (documents.drivingLicenseFront) updateData.drivingLicenseFront = documents.drivingLicenseFront;
            if (documents.drivingLicenseBack) updateData.drivingLicenseBack = documents.drivingLicenseBack;
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
```

### **2. Alternative: Add to Existing User Routes**

If you prefer to add it to existing user routes, you can add this to your user routes:

```javascript
// PATCH /api/users/:id/verification - Update user verification
app.patch('/api/users/:id/verification', async (req, res) => {
    try {
        const userId = req.params.id;
        const verificationData = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            verificationData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Verification updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Verification update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update verification',
            error: error.message
        });
    }
});
```

## 🚀 **How to Add This to Your Main App**

### **Option 1: Add to app.js**
Add the verification endpoint directly to your main `app.js` or `server.js` file.

### **Option 2: Create New Route File**
1. Create `api/routes/verifications.js`
2. Add the endpoint code
3. Import it in your main app:
```javascript
const verificationRoutes = require('./routes/verifications');
app.use('/api', verificationRoutes);
```

## 🔍 **Test the Endpoint**

After adding the endpoint, test it with curl:

```bash
curl -X POST http://localhost:5000/api/verifications \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+917021098460",
    "dob": "1990-01-01",
    "gender": "male",
    "address": "Test Address",
    "city": "Test City",
    "state": "Test State",
    "pincode": "123456",
    "documents": {
      "profilePhoto": "data:image/jpeg;base64,...",
      "aadharFront": "data:image/jpeg;base64,..."
    },
    "verificationStatus": "pending",
    "isVerified": false
  }'
```

## ✅ **Expected Result**

After adding this endpoint and testing the verification form:

1. **Verification form** will send data to your backend
2. **User data** will be updated with verification information
3. **Admin panel** will show the verification data
4. **Documents** will be stored and viewable in admin panel

## 🔧 **Troubleshooting**

If you get errors:
1. **Check console logs** in your main app
2. **Verify the endpoint URL** matches your app's structure
3. **Check if User model** has the required fields
4. **Test with curl** first to verify the endpoint works

---

**Add this endpoint to your main app, restart the server, and then try the verification form again!** 🚀
