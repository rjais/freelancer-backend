const express = require('express');
const router = express.Router();
const admin = require('../firebase-config');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

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

// Get all jobs
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('client', 'name phone')
      .populate('freelancer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by status
router.get('/status/:status', verifyFirebaseToken, async (req, res) => {
  try {
    const { status } = req.params;
    const jobs = await Job.find({ status })
      .populate('client', 'name phone')
      .populate('freelancer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'name phone')
      .populate('freelancer', 'name phone')
      .populate('applications');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new job
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jobData = {
      ...req.body,
      client: user._id,
      status: 'open'
    };

    const job = new Job(jobData);
    await job.save();
    
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the job owner
    const user = await User.findOne({ firebaseUid: userId });
    if (job.client.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete job
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (job.client.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pickup/Assign job to freelancer
router.post('/:id/pickup', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    console.log('Pickup request - User ID:', userId);
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      console.log('Job not found:', req.params.id);
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', { id: user._id, role: user.role, name: user.name });
    console.log('Job status:', job.status);

    // Check if job is available for pickup
    if (job.status !== 'open') {
      console.log('Job not open for pickup, status:', job.status);
      return res.status(400).json({ error: 'Job is not available for pickup' });
    }

    // Check if user is a freelancer
    if (user.role !== 'freelancer') {
      console.log('User is not freelancer, role:', user.role);
      return res.status(403).json({ error: 'Only freelancers can pickup jobs' });
    }

    // Assign job to the freelancer
    job.freelancer = user._id;
    job.status = 'assigned';
    job.assignedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Job picked up successfully',
      job
    });
  } catch (error) {
    console.error('Pickup job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start work (Freelancer)
router.post('/:id/start-work', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (job.freelancer.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (job.status !== 'assigned') {
      return res.status(400).json({ error: 'Job must be assigned before starting work' });
    }

    job.status = 'in_progress';
    await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark work as done (Freelancer)
router.post('/:id/work-done', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (job.freelancer.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Job must be in progress before marking as done' });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Work marked as completed. Waiting for client payment.',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by status
router.get('/status/:status', verifyFirebaseToken, async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseUid: userId });

    let query = { status };
    
    // Filter by user role
    if (user.role === 'client') {
      query.client = user._id;
    } else if (user.role === 'freelancer') {
      query.freelancer = user._id;
    }

    const jobs = await Job.find(query)
      .populate('client', 'name phone')
      .populate('freelancer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's jobs (client or freelancer)
router.get('/user/me', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseUid: userId });

    let query = {};
    
    if (user.role === 'client') {
      query.client = user._id;
    } else if (user.role === 'freelancer') {
      query.freelancer = user._id;
    }

    const jobs = await Job.find(query)
      .populate('client', 'name phone')
      .populate('freelancer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay for completed job (Client)
router.post('/:id/pay', verifyFirebaseToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.uid;
    
    console.log('Payment request - Job ID:', jobId, 'User ID:', userId);
    
    const job = await Job.findById(jobId).populate('client freelancer');
    if (!job) {
      console.log('Job not found:', jobId);
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Job client ID:', job.client._id.toString());
    console.log('User ID:', user._id.toString());
    console.log('Job status:', job.status);

    if (job.client._id.toString() !== user._id.toString()) {
      console.log('Authorization failed - client mismatch');
      return res.status(403).json({ 
        error: 'Not authorized to pay for this job',
        details: {
          jobClient: job.client._id.toString(),
          user: user._id.toString(),
          match: job.client._id.toString() === user._id.toString()
        }
      });
    }

    if (job.status !== 'completed') {
      console.log('Job not completed, status:', job.status);
      return res.status(400).json({ error: 'Job must be completed before payment' });
    }

    // Credit freelancer's wallet
    const freelancer = await User.findById(job.freelancer._id);
    if (!freelancer) {
      console.log('Freelancer not found:', job.freelancer._id);
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    // Update freelancer's wallet balance
    freelancer.walletBalance = (freelancer.walletBalance || 0) + job.price;
    await freelancer.save();

    // Create transaction record
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      userId: freelancer.firebaseUid,
      type: 'credit',
      category: 'job_payment',
      amount: job.price,
      currency: 'INR',
      status: 'completed',
      description: `Payment for job: ${job.title}`,
      jobId: job._id
    });
    await transaction.save();

    // Mark job as paid
    job.status = 'paid';
    job.paidAt = new Date();
    await job.save();

    console.log('Payment successful for job:', jobId);
    console.log('Freelancer wallet credited:', freelancer.walletBalance);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      job: {
        id: job._id,
        title: job.title,
        price: job.price,
        status: job.status,
        freelancer: {
          name: job.freelancer.name,
          firebaseUid: job.freelancer.firebaseUid
        }
      },
      freelancerBalance: freelancer.walletBalance
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

module.exports = router; 