// Admin Panel Configuration
// Update these settings to connect to your main app

const CONFIG = {
    // Main App API Base URL
    API_BASE_URL: 'http://localhost:5000/api', // Connected to your app successfully
    
    // Authentication - Updated for Firebase
    AUTH_ENDPOINTS: {
        LOGIN: '/admin/login', // Firebase admin login
        LOGOUT: '/admin/logout',
        VERIFY_TOKEN: '/admin/verify-token'
    },
    
    // Verification Endpoints - Updated for your actual API
    VERIFICATION_ENDPOINTS: {
        GET_ALL: '/admin/users', // Get all users with verification status
        GET_PENDING: '/admin/users?verificationStatus=pending',
        GET_APPROVED: '/admin/users?verificationStatus=approved',
        GET_REJECTED: '/admin/users?verificationStatus=rejected',
        APPROVE: '/admin/users/:id/verification-status', // Your actual endpoint
        REJECT: '/admin/users/:id/verification-status', // Your actual endpoint
        GET_BY_ID: '/admin/users/:id'
    },
    
    // File Upload Endpoints
    UPLOAD_ENDPOINTS: {
        UPLOAD_DOCUMENT: '/upload/document',
        GET_DOCUMENT: '/documents/:id'
    },
    
    // Admin Settings
    ADMIN_SETTINGS: {
        AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
        SESSION_TIMEOUT: 3600000, // 1 hour
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif']
    },
    
    // API Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// API Helper Functions
class API {
    static async request(endpoint, options = {}) {
        const url = CONFIG.API_BASE_URL + endpoint;
        const headers = {
            ...CONFIG.DEFAULT_HEADERS,
            ...options.headers
        };

        // Add Firebase auth token if available
        const token = localStorage.getItem('adminToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['firebase-token'] = token; // Add Firebase token header
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    static async login(credentials) {
        return this.request(CONFIG.AUTH_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async logout() {
        return this.request(CONFIG.AUTH_ENDPOINTS.LOGOUT, {
            method: 'POST'
        });
    }

    static async verifyToken() {
        return this.request(CONFIG.AUTH_ENDPOINTS.VERIFY_TOKEN);
    }

    // Verifications
    static async getVerifications(status = null) {
        const endpoint = status ? CONFIG.VERIFICATION_ENDPOINTS[`GET_${status.toUpperCase()}`] : CONFIG.VERIFICATION_ENDPOINTS.GET_ALL;
        return this.request(endpoint);
    }

    static async getVerificationById(id) {
        const endpoint = CONFIG.VERIFICATION_ENDPOINTS.GET_BY_ID.replace(':id', id);
        return this.request(endpoint);
    }

    static async approveVerification(id, comments = '') {
        const endpoint = CONFIG.VERIFICATION_ENDPOINTS.APPROVE.replace(':id', id);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ comments })
        });
    }

    static async rejectVerification(id, comments) {
        const endpoint = CONFIG.VERIFICATION_ENDPOINTS.REJECT.replace(':id', id);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ comments })
        });
    }

    // File Upload
    static async uploadDocument(file) {
        const formData = new FormData();
        formData.append('document', file);

        const url = CONFIG.API_BASE_URL + CONFIG.UPLOAD_ENDPOINTS.UPLOAD_DOCUMENT;
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed! status: ${response.status}`);
        }

        return await response.json();
    }

    static getDocumentUrl(documentId) {
        return CONFIG.API_BASE_URL + CONFIG.UPLOAD_ENDPOINTS.GET_DOCUMENT.replace(':id', documentId);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, API };
} else {
    window.CONFIG = CONFIG;
    window.API = API;
}
