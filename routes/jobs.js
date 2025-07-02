const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
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

// List all jobs
router.get('/', async (req, res) => {
  const jobs = await Job.find().populate('client', 'name email').populate('freelancer', 'name email');
  res.json(jobs);
});

// Create a job (client only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can post jobs' });
    const job = new Job({ ...req.body, client: req.user.id });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get job by id
router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id).populate('client', 'name email').populate('freelancer', 'name email');
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// Update job (client only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete job (client only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await job.remove();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Freelancer applies to a job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') return res.status(403).json({ message: 'Only freelancers can apply' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Check if already applied
    const existing = await Application.findOne({ job: job._id, freelancer: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already applied' });
    const application = new Application({ job: job._id, freelancer: req.user.id, message: req.body.message });
    await application.save();
    job.applications.push(application._id);
    job.status = 'applied';
    await job.save();
    res.status(201).json({ message: 'Applied successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 