const express = require('express');
const router = express.Router();
const admin = require('../firebase-config');
const crypto = require('crypto');
const axios = require('axios');

// PhonePe Configuration
const PHONEPE_CONFIG = {
  MERCHANT_ID: 'TEST-M23OKIGC1N363_25081',
  CLIENT_SECRET: 'OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm',
  ENVIRONMENT: 'TEST', // Change to 'PROD' for production
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Change to production URL for live
};

// Import models
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate PhonePe Transaction ID
const generateTransactionId = () => {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate Checksum for PhonePe
const generateChecksum = (payload, secretKey) => {
  const data = payload + '/pg/v1/pay' + secretKey;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash + '###' + '1';
};

// Create PhonePe Payment Order
router.post('/create-order', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;
    const userId = req.user.uid;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transactionId = generateTransactionId();
    
    // Prepare payment payload
    const payload = {
      merchantId: PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amount,
      redirectUrl: 'https://webhook.site/redirect-url',
      redirectMode: 'POST',
      callbackUrl: 'https://webhook.site/callback-url',
      mobileNumber: req.user.phone_number || '',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Create base64 encoded payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    // Generate checksum
    const checksum = generateChecksum(base64Payload, PHONEPE_CONFIG.CLIENT_SECRET);
    
    // Prepare request body
    const requestBody = {
      request: base64Payload,
    };

    // Make API call to PhonePe
    const response = await axios.post(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
    });

    if (response.data.success) {
      res.json({
        success: true,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId,
        merchantTransactionId: response.data.data.merchantTransactionId,
        amount: amount,
        currency: currency,
      });
    } else {
      res.status(400).json({ 
        error: 'Payment initiation failed',
        message: response.data.message 
      });
    }
  } catch (error) {
    console.error('Create PhonePe order error:', error);
    res.status(500).json({ error: 'Failed to create PhonePe payment order' });
  }
});

// Verify PhonePe Payment
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { merchantTransactionId, jobId, paymentType = 'wallet_recharge' } = req.body;
    const userId = req.user.uid;

    if (!merchantTransactionId) {
      return res.status(400).json({ error: 'Missing merchant transaction ID' });
    }

    // Generate checksum for status check
    const statusPayload = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`;
    const statusChecksum = crypto
      .createHash('sha256')
      .update(statusPayload + PHONEPE_CONFIG.CLIENT_SECRET)
      .digest('hex') + '###' + '1';

    // Check payment status from PhonePe
    const statusResponse = await axios.get(
      `${PHONEPE_CONFIG.BASE_URL}/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': statusChecksum,
          'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID,
        },
      }
    );

    if (statusResponse.data.success) {
      const paymentData = statusResponse.data.data;
      
      if (paymentData.paymentState === 'COMPLETED') {
        // Find existing transaction record
        let transaction = await Transaction.findOne({ merchantTransactionId });
        
        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update transaction status
        transaction.status = 'completed';
        transaction.phonepeTransactionId = paymentData.transactionId;
        await transaction.save();

        // Handle different payment types
        if (transaction.category === 'job_payment') {
          // Update freelancer's wallet balance
          const freelancer = await User.findOne({ firebaseUid: transaction.userId });
          if (freelancer) {
            freelancer.walletBalance = (freelancer.walletBalance || 0) + (paymentData.amount / 100);
            await freelancer.save();
          }

          // Update job status to paid
          if (transaction.jobId) {
            const job = await Job.findById(transaction.jobId);
            if (job) {
              job.status = 'paid';
              job.paidAt = new Date();
              await job.save();
            }
          }

          res.json({
            success: true,
            message: 'Job payment completed successfully',
            payment: {
              merchantTransactionId: paymentData.merchantTransactionId,
              amount: paymentData.amount,
              currency: paymentData.currency,
              status: paymentData.paymentState,
            },
            transaction: {
              id: transaction._id,
              type: transaction.type,
              category: transaction.category,
              amount: transaction.amount,
              status: transaction.status,
              description: transaction.description
            },
            freelancerBalance: freelancer ? freelancer.walletBalance : 0
          });
        } else {
          // Wallet recharge
          const user = await User.findOne({ firebaseUid: userId });
          if (user) {
            user.walletBalance = (user.walletBalance || 0) + (paymentData.amount / 100);
            await user.save();
          }

          res.json({
            success: true,
            message: 'Wallet recharge completed successfully',
            payment: {
              merchantTransactionId: paymentData.merchantTransactionId,
              amount: paymentData.amount,
              currency: paymentData.currency,
              status: paymentData.paymentState,
            },
            transaction: {
              id: transaction._id,
              type: transaction.type,
              category: transaction.category,
              amount: transaction.amount,
              status: transaction.status,
              description: transaction.description
            },
            newBalance: user ? user.walletBalance : 0
          });
        }
      } else {
        res.status(400).json({ 
          error: 'Payment not completed',
          status: paymentData.paymentState 
        });
      }
    } else {
      res.status(400).json({ 
        error: 'Payment verification failed',
        message: statusResponse.data.message 
      });
    }
  } catch (error) {
    console.error('PhonePe payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get PhonePe Payment Status
router.get('/status/:merchantTransactionId', verifyFirebaseToken, async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const userId = req.user.uid;

    if (!merchantTransactionId) {
      return res.status(400).json({ error: 'Missing merchant transaction ID' });
    }

    // Generate checksum for status check
    const statusPayload = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`;
    const statusChecksum = crypto
      .createHash('sha256')
      .update(statusPayload + PHONEPE_CONFIG.CLIENT_SECRET)
      .digest('hex') + '###' + '1';

    // Check payment status from PhonePe
    const statusResponse = await axios.get(
      `${PHONEPE_CONFIG.BASE_URL}/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': statusChecksum,
          'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID,
        },
      }
    );

    if (statusResponse.data.success) {
      res.json({
        success: true,
        paymentStatus: statusResponse.data.data,
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to get payment status',
        message: statusResponse.data.message 
      });
    }
  } catch (error) {
    console.error('Get PhonePe payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Job Payment (Client paying to App for Freelancer)
router.post('/job-payment', verifyFirebaseToken, async (req, res) => {
  try {
    const { jobId, amount, paymentMethod = 'phonepe' } = req.body;
    const clientId = req.user.uid;

    if (!jobId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Verify job exists and belongs to client
    const job = await Job.findById(jobId).populate('client freelancer');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Not authorized to pay for this job' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed before payment' });
    }

    if (!job.freelancer) {
      return res.status(400).json({ error: 'No freelancer assigned to this job' });
    }

    // Create payment order based on payment method
    if (paymentMethod === 'phonepe') {
      const transactionId = generateTransactionId();
      
      // Prepare payment payload for job payment
      const payload = {
        merchantId: PHONEPE_CONFIG.MERCHANT_ID,
        merchantTransactionId: transactionId,
        merchantUserId: clientId,
        amount: amount * 100, // Convert to paise
        redirectUrl: 'https://webhook.site/redirect-url',
        redirectMode: 'POST',
        callbackUrl: 'https://webhook.site/callback-url',
        mobileNumber: req.user.phone_number || '',
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
        notes: {
          jobId: jobId,
          paymentType: 'job_payment',
          freelancerId: job.freelancer._id.toString()
        }
      };

      // Create base64 encoded payload
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Generate checksum
      const checksum = generateChecksum(base64Payload, PHONEPE_CONFIG.CLIENT_SECRET);
      
      // Prepare request body
      const requestBody = {
        request: base64Payload,
      };

      // Make API call to PhonePe
      const response = await axios.post(`${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
      });

      if (response.data.success) {
        // Create pending transaction record
        const transaction = new Transaction({
          userId: job.freelancer.firebaseUid,
          type: 'credit',
          category: 'job_payment',
          amount: amount * 100,
          currency: 'INR',
          status: 'pending',
          description: `Payment for job: ${job.title}`,
          jobId,
          merchantTransactionId: transactionId,
          metadata: {
            clientId: clientId,
            paymentMethod: 'phonepe'
          }
        });

        await transaction.save();

        res.json({
          success: true,
          paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
          transactionId: transactionId,
          merchantTransactionId: response.data.data.merchantTransactionId,
          amount: amount,
          currency: 'INR',
          message: 'Payment initiated successfully'
        });
      } else {
        res.status(400).json({ 
          error: 'Payment initiation failed',
          message: response.data.message 
        });
      }
    } else {
      // For other payment methods (GPay, Paytm), implement similar logic
      res.status(400).json({ error: 'Payment method not supported yet' });
    }
  } catch (error) {
    console.error('Job payment error:', error);
    res.status(500).json({ error: 'Job payment failed' });
  }
});

// PhonePe Callback Handler
router.post('/callback', async (req, res) => {
  try {
    const { merchantTransactionId, transactionId, amount, status, paymentInstrument } = req.body;

    console.log('PhonePe Callback received:', {
      merchantTransactionId,
      transactionId,
      amount,
      status,
      paymentInstrument,
    });

    // In a real application, you would:
    // 1. Verify the callback signature
    // 2. Update your database with payment status
    // 3. Send notifications to user
    // 4. Update wallet balance if payment is successful

    // For now, just acknowledge the callback
    res.json({
      success: true,
      message: 'Callback received successfully',
    });
  } catch (error) {
    console.error('PhonePe callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// PhonePe Redirect Handler
router.post('/redirect', async (req, res) => {
  try {
    const { merchantTransactionId, transactionId, amount, status, paymentInstrument } = req.body;

    console.log('PhonePe Redirect received:', {
      merchantTransactionId,
      transactionId,
      amount,
      status,
      paymentInstrument,
    });

    // In a real application, you would:
    // 1. Verify the redirect data
    // 2. Update your database
    // 3. Redirect user to appropriate page

    // For now, just acknowledge the redirect
    res.json({
      success: true,
      message: 'Redirect received successfully',
    });
  } catch (error) {
    console.error('PhonePe redirect error:', error);
    res.status(500).json({ error: 'Redirect processing failed' });
  }
});

module.exports = router;
