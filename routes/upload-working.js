const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dzpqrejsi',
  api_key: '793932964222322',
  api_secret: 'CA2z7uPNGhuCSYGoSunXp3U6G-g'
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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

    console.log('Processing file:', req.file.originalname);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'people-app-documents',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write the buffer to the upload stream
      uploadStream.end(req.file.buffer);
    });

    console.log('File uploaded successfully to Cloudinary:', {
      originalName: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: result.public_id,
        url: result.secure_url,
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

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  console.error('Upload route error:', error);
  res.status(500).json({
    success: false,
    message: 'Upload failed',
    error: error.message
  });
});

module.exports = router;
