const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
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

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { job, receiver, content } = req.body;
    if (!job || !receiver || !content) return res.status(400).json({ message: 'Missing fields' });
    const message = new Message({
      job,
      sender: req.user.id,
      receiver,
      content,
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get messages by job
router.get('/job/:jobId', auth, async (req, res) => {
  const messages = await Message.find({ job: req.params.jobId }).sort({ createdAt: 1 });
  res.json(messages);
});

// Get messages between two users for a job
router.get('/job/:jobId/users/:user1/:user2', auth, async (req, res) => {
  const { jobId, user1, user2 } = req.params;
  const messages = await Message.find({
    job: jobId,
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = router; 