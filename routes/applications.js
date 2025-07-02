const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// List applications by job
router.get('/job/:jobId', auth, async (req, res) => {
  const applications = await Application.find({ job: req.params.jobId }).populate('freelancer', 'name email phone');
  res.json(applications);
});

// List applications by freelancer
router.get('/freelancer/:freelancerId', auth, async (req, res) => {
  const applications = await Application.find({ freelancer: req.params.freelancerId }).populate('job');
  res.json(applications);
});

// Get application by id
router.get('/:id', auth, async (req, res) => {
  const application = await Application.findById(req.params.id).populate('freelancer', 'name email phone').populate('job');
  if (!application) return res.status(404).json({ message: 'Application not found' });
  res.json(application);
});

// Update application status (accept/reject)
router.patch('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.status = req.body.status;
    await application.save();
    // If accepted, update job status and assign freelancer
    if (req.body.status === 'accepted') {
      const job = await Job.findById(application.job);
      job.status = 'in_progress';
      job.freelancer = application.freelancer;
      await job.save();
    }
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 