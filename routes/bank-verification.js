const express = require('express');
const router = express.Router();
const admin = require('../firebase-config');
const User = require('../models/User');

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

// Verify bank account and fetch account holder name
router.post('/verify-account', firebaseAuth, async (req, res) => {
  try {
    const { accountNumber, ifscCode } = req.body;
    const userId = req.user.mongoId;

    if (!accountNumber || !ifscCode) {
      return res.status(400).json({ error: 'Account number and IFSC code are required' });
    }

    // Validate account number format (9-18 digits)
    if (!/^\d{9,18}$/.test(accountNumber)) {
      return res.status(400).json({ error: 'Invalid account number format' });
    }

    // Validate IFSC code format (4 letters + 7 alphanumeric)
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid IFSC code format' });
    }

    console.log('Verifying bank account:', { accountNumber, ifscCode });

    // Method 1: Try PhonePe Account Verification (if available)
    try {
      const phonepeResponse = await verifyWithPhonePe(accountNumber, ifscCode);
      if (phonepeResponse.success) {
        return res.json({
          success: true,
          accountHolderName: phonepeResponse.accountHolderName,
          bankName: phonepeResponse.bankName,
          verified: true,
          method: 'phonepe'
        });
      }
    } catch (phonepeError) {
      console.log('PhonePe verification failed, trying alternative method');
    }

    // Method 2: Try NPCI Account Verification
    try {
      const npciResponse = await verifyWithNPCI(accountNumber, ifscCode);
      if (npciResponse.success) {
        return res.json({
          success: true,
          accountHolderName: npciResponse.accountHolderName,
          bankName: npciResponse.bankName,
          verified: true,
          method: 'npci'
        });
      }
    } catch (npciError) {
      console.log('NPCI verification failed, trying alternative method');
    }

    // Method 3: Try Razorpay Account Verification
    try {
      const razorpayResponse = await verifyWithRazorpay(accountNumber, ifscCode);
      if (razorpayResponse.success) {
        return res.json({
          success: true,
          accountHolderName: razorpayResponse.accountHolderName,
          bankName: razorpayResponse.bankName,
          verified: true,
          method: 'razorpay'
        });
      }
    } catch (razorpayError) {
      console.log('Razorpay verification failed');
    }

    // If all methods fail, return error
    return res.status(400).json({ 
      error: 'Unable to verify bank account. Please check the account number and IFSC code.',
      details: 'Account verification service is temporarily unavailable'
    });

  } catch (error) {
    console.error('Bank account verification error:', error);
    res.status(500).json({ error: 'Failed to verify bank account' });
  }
});

// PhonePe Account Verification
async function verifyWithPhonePe(accountNumber, ifscCode) {
  try {
    // PhonePe Account Verification API endpoint
    const phonepeUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/account/verify';
    
    const payload = {
      accountNumber: accountNumber,
      ifsc: ifscCode.toUpperCase()
    };

    const response = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': generatePhonePeChecksum(payload),
        'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        accountHolderName: data.data.accountHolderName,
        bankName: data.data.bankName
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('PhonePe verification error:', error);
    return { success: false };
  }
}

// NPCI Account Verification (using UPI)
async function verifyWithNPCI(accountNumber, ifscCode) {
  try {
    // This would use NPCI's official API
    // For now, we'll simulate it
    console.log('NPCI verification not implemented yet');
    return { success: false };
  } catch (error) {
    console.error('NPCI verification error:', error);
    return { success: false };
  }
}

// Razorpay Account Verification
async function verifyWithRazorpay(accountNumber, ifscCode) {
  try {
    // Razorpay Account Verification API
    const razorpayUrl = 'https://api.razorpay.com/v1/accounts/validate';
    
    const payload = {
      account_number: accountNumber,
      ifsc: ifscCode.toUpperCase()
    };

    const response = await fetch(razorpayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        accountHolderName: data.name,
        bankName: data.bank_name
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return { success: false };
  }
}

// Generate PhonePe checksum (you'll need to implement this based on PhonePe docs)
function generatePhonePeChecksum(payload) {
  // This is a placeholder - implement based on PhonePe documentation
  return 'checksum_placeholder';
}

// Update user's bank details with verified account holder name
router.post('/update-bank-details', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.mongoId;
    const { accountNumber, ifscCode, accountHolderName } = req.body;

    if (!accountNumber || !ifscCode || !accountHolderName) {
      return res.status(400).json({ error: 'Account number, IFSC code, and account holder name are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update bank details
    user.bankDetails = {
      accountNumber: accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      accountHolderName: accountHolderName,
      verified: true,
      verifiedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: user.bankDetails
    });

  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ error: 'Failed to update bank details' });
  }
});

// Get bank verification status
router.get('/status', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.mongoId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      bankDetails: user.bankDetails || null,
      verified: user.bankDetails?.verified || false
    });
  } catch (error) {
    console.error('Get bank status error:', error);
    res.status(500).json({ error: 'Failed to get bank status' });
  }
});

module.exports = router;
