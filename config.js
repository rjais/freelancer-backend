const CONFIG = {
    // Update this to your main app's API URL
    API_BASE_URL: process.env.API_BASE_URL || 'https://freelancer-backend-jv21.onrender.com/api',
    
    // JWT Secret (should match your main app)
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    
    // MongoDB URI
    MONGODB_URI: process.env.MONGODB_URI,
    
    // Server port
    PORT: process.env.PORT || 5000,
    
    // CORS settings
    CORS_ORIGINS: [
            'https://freelancer-backend-jv21.onrender.com',
    'https://freelancer-backend-jv21.onrender.com',
        'https://your-admin-domain.com'
    ],
    
    // File upload settings
    UPLOAD_LIMITS: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    
    // Allowed file types for documents
    ALLOWED_DOCUMENT_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    
    // Admin credentials (for initial setup)
    DEFAULT_ADMIN: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@people.com'
    }
};

module.exports = CONFIG;
