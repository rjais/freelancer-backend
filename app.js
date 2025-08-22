require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const applicationsRouter = require('./routes/applications');
const messagesRouter = require('./routes/messages');
const phonepeRouter = require('./routes/phonepe');
const walletRouter = require('./routes/wallet');
const bankVerificationRouter = require('./routes/bank-verification');
const verificationRouter = require('./routes/verification');
const adminRouter = require('./routes/admin');
const uploadRouter = require('./routes/upload');

var app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Log all POST request bodies for debugging
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('POST request to', req.url, 'body:', req.body);
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded profile images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve uploaded documents
app.use('/documents', express.static(path.join(__dirname, 'public/documents')));

// Serve admin panel
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel')));
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Serve debug tool
app.get('/admin-panel/debug-tool.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'debug-tool.html'));
});

app.get('/admin-panel/image-debug-tool.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'image-debug-tool.html'));
});

app.get('/admin-panel/assign-freelancer-id.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'assign-freelancer-id.html'));
});

app.get('/admin-panel/test-freelancer-id.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'test-freelancer-id.html'));
});

app.get('/admin-panel/database-debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'database-debug.html'));
});

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/payments', phonepeRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/bank-verification', bankVerificationRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);

module.exports = app;
