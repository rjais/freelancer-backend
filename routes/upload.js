const express = require('express');
const router = express.Router();
const multer = require('multer');

// Simple multer configuration that doesn't save files
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory only
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload single file
router.post('/single', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate a placeholder URL for testing
    const fileUrl = `https://via.placeholder.com/400x300/007AFF/FFFFFF?text=${encodeURIComponent(req.file.originalname)}`;
    
    console.log('File uploaded successfully (placeholder):', {
      originalName: req.file.originalname,
      url: fileUrl,
      size: req.file.size
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.originalname,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

module.exports = router;
