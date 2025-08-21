const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('../firebase-config');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Middleware to verify JWT token
const verifyJWTToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, length:', token.length);
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, user ID:', decodedToken.id);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get wallet balance
router.get('/balance', firebaseAuth, async (req, res) => {
  try {
    console.log('Wallet balance request - User ID:', req.user.uid);
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found, wallet balance:', user.walletBalance);
    res.json({
      success: true,
      balance: user.walletBalance || 0,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get all transactions (for debugging)
router.get('/all-transactions', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Debug: Fetching ALL transactions for user:', user.firebaseUid);
    
    const allTransactions = await Transaction.find({ userId: user.firebaseUid })
      .sort({ createdAt: -1 });

    console.log('Debug: Found', allTransactions.length, 'total transactions');
    allTransactions.forEach((tx, index) => {
      console.log(`Debug Transaction ${index + 1}:`, {
        id: tx._id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        status: tx.status,
        description: tx.description
      });
    });

    res.json({
      success: true,
      transactions: allTransactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        withdrawalStatus: tx.withdrawalStatus
      }))
    });
  } catch (error) {
    console.error('Debug: Get all transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch all transactions' });
  }
});

// Get transaction history
router.get('/transactions', firebaseAuth, async (req, res) => {
  try {
    console.log('Transaction history request - User ID:', req.user.uid);
    const userId = req.user.uid;
    const { page = 1, limit = 20, category } = req.query;
    
    // First get the user to find their Firebase UID
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      console.log('User not found for Firebase UID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const query = { userId: user.firebaseUid };
    if (category) {
      query.category = category;
      // For withdrawal category, show both pending and completed
      if (category === 'withdrawal') {
        query.status = { $in: ['pending', 'completed'] };
      } else {
        query.status = 'completed';
      }
    } else {
      // Show all transactions: completed payments and pending/completed withdrawals
      query.$or = [
        { status: 'completed' },
        { category: 'withdrawal', status: { $in: ['pending', 'completed'] } }
      ];
    }

    console.log('Query for transactions:', query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('jobId', 'title');

    const total = await Transaction.countDocuments(query);
    console.log('Found transactions:', transactions.length, 'Total:', total);

    // Debug: Log each transaction
    transactions.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}:`, {
        id: tx._id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        jobTitle: tx.jobId?.title
      });
    });

    const responseData = {
      success: true,
      transactions: transactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        description: tx.description,
        jobTitle: tx.jobId?.title,
        createdAt: tx.createdAt,
        withdrawalStatus: tx.withdrawalStatus
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log('Sending response data:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

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

// Request withdrawal
router.post('/withdraw', firebaseAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return res.status(400).json({ error: 'Complete bank details required' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has sufficient balance
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId: firebaseUid,
      type: 'debit',
      category: 'withdrawal',
      amount,
      currency: 'INR',
      status: 'pending',
      description: 'Withdrawal to bank account',
      bankDetails,
      withdrawalStatus: 'pending'
    });

    await transaction.save();

    // Update user's wallet balance to zero (withdrawing all available balance)
    user.walletBalance = 0;
    await user.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transaction: transaction,
      amount,
      withdrawalStatus: 'pending'
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Withdrawal request failed' });
  }
});

// Update bank details
router.put('/bank-details', verifyJWTToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountNumber, ifscCode, accountHolderName, bankName } = req.body;

    if (!accountNumber || !ifscCode || !accountHolderName) {
      return res.status(400).json({ error: 'Complete bank details required' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.bankDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName
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

// Get bank details
router.get('/bank-details', verifyJWTToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      bankDetails: user.bankDetails || null
    });
  } catch (error) {
    console.error('Get bank details error:', error);
    res.status(500).json({ error: 'Failed to fetch bank details' });
  }
});

// Get withdrawal statistics
router.get('/withdrawal-stats', verifyJWTToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Transaction.aggregate([
      { $match: { userId, category: 'withdrawal' } },
      {
        $group: {
          _id: '$withdrawalStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
    });

    res.json({
      success: true,
      stats: statsMap
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal statistics' });
  }
});

module.exports = router;
