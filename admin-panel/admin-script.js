// Admin Panel JavaScript

// Global variables
let currentUser = null;
let verifications = [];
let currentVerification = null;

// Load configuration
let CONFIG, API;

// Sample data for demonstration
const sampleVerifications = [
    {
        id: 1,
        userId: 101,
        userName: "Rahul Sharma",
        userEmail: "rahul.sharma@email.com",
        userPhone: "+91 9876543210",
        documentType: "aadhar",
        documents: {
            front: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWFkaGFyIENhcmQgLSBGcm9udDwvdGV4dD4KPC9zdmc+",
            back: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWFkaGFyIENhcmQgLSBCYWNrPC90ZXh0Pgo8L3N2Zz4="
        },
        status: "pending",
        submittedAt: "2024-01-15T10:30:00Z",
        reviewedAt: null,
        reviewedBy: null,
        comments: null
    },
    {
        id: 2,
        userId: 102,
        userName: "Priya Patel",
        userEmail: "priya.patel@email.com",
        userPhone: "+91 8765432109",
        documentType: "pan",
        documents: {
            front: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UEFOIENhcmQgLSBGcm9udDwvdGV4dD4KPC9zdmc+"
        },
        status: "pending",
        submittedAt: "2024-01-15T11:45:00Z",
        reviewedAt: null,
        reviewedBy: null,
        comments: null
    },
    {
        id: 3,
        userId: 103,
        userName: "Amit Kumar",
        userEmail: "amit.kumar@email.com",
        userPhone: "+91 7654321098",
        documentType: "driving",
        documents: {
            front: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RHJpdmluZyBMaWNlbnNlPC90ZXh0Pgo8L3N2Zz4=",
            back: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RHJpdmluZyBMaWNlbnNlIC0gQmFjazwvdGV4dD4KPC9zdmc+"
        },
        status: "approved",
        submittedAt: "2024-01-14T09:15:00Z",
        reviewedAt: "2024-01-15T08:30:00Z",
        reviewedBy: "admin",
        comments: "Documents verified successfully. All details match."
    },
    {
        id: 4,
        userId: 104,
        userName: "Neha Singh",
        userEmail: "neha.singh@email.com",
        userPhone: "+91 6543210987",
        documentType: "aadhar",
        documents: {
            front: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWFkaGFyIENhcmQgLSBGcm9udDwvdGV4dD4KPC9zdmc+",
            back: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNFNUU3RUIiLz4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjQ3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWFkaGFyIENhcmQgLSBCYWNrPC90ZXh0Pgo8L3N2Zz4="
        },
        status: "rejected",
        submittedAt: "2024-01-13T14:20:00Z",
        reviewedAt: "2024-01-14T10:15:00Z",
        reviewedBy: "admin",
        comments: "Document images are blurry and unreadable. Please upload clear, high-resolution images."
    }
];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Load configuration first
    loadConfiguration().then(() => {
        initializeAdminPanel();
    }).catch(error => {
        console.error('Failed to load configuration:', error);
        // Fallback to demo mode
        initializeDemoMode();
    });
});

async function loadConfiguration() {
    try {
        // Try to load config from external file
        const configResponse = await fetch('./config.js');
        if (configResponse.ok) {
            // If config.js exists, use it
            const configScript = document.createElement('script');
            configScript.src = './config.js';
            document.head.appendChild(configScript);
            
            // Wait for script to load
            await new Promise((resolve) => {
                configScript.onload = resolve;
            });
            
            CONFIG = window.CONFIG;
            API = window.API;
        } else {
            // Use default config
            CONFIG = {
                API_BASE_URL: 'http://localhost:3000/api',
                ADMIN_SETTINGS: {
                    AUTO_REFRESH_INTERVAL: 30000
                }
            };
            API = null;
        }
    } catch (error) {
        console.warn('Using demo mode - no API configuration found');
        CONFIG = {
            API_BASE_URL: null,
            ADMIN_SETTINGS: {
                AUTO_REFRESH_INTERVAL: 30000
            }
        };
        API = null;
    }
}

function initializeDemoMode() {
    console.log('Running in demo mode with sample data');
    initializeAdminPanel();
}

function initializeAdminPanel() {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLoginScreen();
    }

    // Setup event listeners
    setupEventListeners();
    
    // Load sample data
    verifications = [...sampleVerifications];
    updateDashboard();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Filters
    const documentTypeFilter = document.getElementById('documentTypeFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (documentTypeFilter) {
        documentTypeFilter.addEventListener('change', filterVerifications);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', filterVerifications);
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    showSection('dashboard');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        if (API) {
            // Use Firebase admin authentication
            const response = await API.login({ username, password });
            if (response.success) {
                currentUser = response.user;
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                showDashboard();
            } else {
                alert(response.message || 'Login failed');
            }
        } else {
            // Demo mode authentication
            if (username === 'admin' && password === 'admin123') {
                currentUser = { username: username, role: 'admin' };
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                showDashboard();
            } else {
                alert('Invalid credentials. Use admin/admin123 for demo.');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    showLoginScreen();
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to nav item
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Load section-specific content
    switch(sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'pending':
            loadPendingVerifications();
            break;
        case 'approved':
            loadApprovedVerifications();
            break;
        case 'rejected':
            loadRejectedVerifications();
            break;
    }
}

async function updateDashboard() {
    try {
        if (API) {
            // Load users from API to calculate stats
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const users = data.verifications || [];
                
                // Calculate stats from users data
                const pendingCount = users.filter(u => u.verificationStatus === 'pending').length;
                const approvedCount = users.filter(u => u.verificationStatus === 'approved').length;
                const rejectedCount = users.filter(u => u.verificationStatus === 'rejected').length;
                const totalCount = users.length;
                
                // Update stats
                document.getElementById('pendingStats').textContent = pendingCount;
                document.getElementById('approvedStats').textContent = approvedCount;
                document.getElementById('rejectedStats').textContent = rejectedCount;
                document.getElementById('totalStats').textContent = totalCount;
                
                // Update pending count badge
                const pendingBadge = document.getElementById('pendingCount');
                if (pendingBadge) {
                    pendingBadge.textContent = pendingCount;
                    pendingBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
                }
                
                // Load recent activity
                loadRecentActivity();
            }
        } else {
            // Use demo data
            const pendingCount = verifications.filter(v => v.status === 'pending').length;
            const approvedToday = verifications.filter(v => 
                v.status === 'approved' && 
                isToday(new Date(v.reviewedAt))
            ).length;
            const rejectedToday = verifications.filter(v => 
                v.status === 'rejected' && 
                isToday(new Date(v.reviewedAt))
            ).length;
            const totalCount = verifications.length;
            
            // Update stats
            document.getElementById('pendingStats').textContent = pendingCount;
            document.getElementById('approvedStats').textContent = approvedToday;
            document.getElementById('rejectedStats').textContent = rejectedToday;
            document.getElementById('totalStats').textContent = totalCount;
            
            // Update pending count badge
            const pendingBadge = document.getElementById('pendingCount');
            if (pendingBadge) {
                pendingBadge.textContent = pendingCount;
                pendingBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
            }
            
            // Load recent activity
            loadRecentActivity();
        }
    } catch (error) {
        console.error('Failed to update dashboard:', error);
        // Fallback to demo data
        const pendingCount = verifications.filter(v => v.status === 'pending').length;
        const approvedToday = verifications.filter(v => 
            v.status === 'approved' && 
            isToday(new Date(v.reviewedAt))
        ).length;
        const rejectedToday = verifications.filter(v => 
            v.status === 'rejected' && 
            isToday(new Date(v.reviewedAt))
        ).length;
        const totalCount = verifications.length;
        
        // Update stats
        document.getElementById('pendingStats').textContent = pendingCount;
        document.getElementById('approvedStats').textContent = approvedToday;
        document.getElementById('rejectedStats').textContent = rejectedToday;
        document.getElementById('totalStats').textContent = totalCount;
        
        // Update pending count badge
        const pendingBadge = document.getElementById('pendingCount');
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount;
            pendingBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
        }
        
        // Load recent activity
        loadRecentActivity();
    }
}
    
    // Update stats
    document.getElementById('pendingStats').textContent = pendingCount;
    document.getElementById('approvedStats').textContent = approvedToday;
    document.getElementById('rejectedStats').textContent = rejectedToday;
    document.getElementById('totalStats').textContent = totalCount;
    
    // Update pending count badge
    const pendingBadge = document.getElementById('pendingCount');
    if (pendingBadge) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
    }
    
    // Load recent activity
    loadRecentActivity();
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;
    
    // Get recent verifications (last 5)
    const recentVerifications = verifications
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5);
    
    activityList.innerHTML = '';
    
    recentVerifications.forEach(verification => {
        const activityItem = createActivityItem(verification);
        activityList.appendChild(activityItem);
    });
}

function createActivityItem(verification) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const iconClass = verification.status === 'approved' ? 'approved' : 
                     verification.status === 'rejected' ? 'rejected' : 'pending';
    const icon = verification.status === 'approved' ? 'fa-check-circle' :
                 verification.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
    
    item.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="fas ${icon}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-title">${verification.userName} - ${getDocumentTypeName(verification.documentType)}</div>
            <div class="activity-time">${formatDate(verification.submittedAt)}</div>
        </div>
    `;
    
    return item;
}

async function loadPendingVerifications() {
    const container = document.getElementById('pendingVerifications');
    if (!container) return;
    
    try {
        if (API) {
            // Load from API using correct endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users?verificationStatus=pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                verifications = data.verifications || [];
            } else {
                throw new Error('Failed to fetch pending verifications');
            }
        } else {
            // Use demo data
            verifications = sampleVerifications;
        }
        
        const pendingVerifications = verifications.filter(v => v.verificationStatus === 'pending');
        renderVerificationsList(container, pendingVerifications);
    } catch (error) {
        console.error('Failed to load pending verifications:', error);
        // Fallback to demo data
        const pendingVerifications = sampleVerifications.filter(v => v.status === 'pending');
        renderVerificationsList(container, pendingVerifications);
    }
}

async function loadApprovedVerifications() {
    const container = document.getElementById('approvedVerifications');
    if (!container) return;
    
    try {
        if (API) {
            // Load from API using correct endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users?verificationStatus=approved`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                verifications = data.verifications || [];
            } else {
                throw new Error('Failed to fetch approved verifications');
            }
        } else {
            // Use demo data
            verifications = sampleVerifications;
        }
        
        const approvedVerifications = verifications.filter(v => v.verificationStatus === 'approved');
        renderVerificationsList(container, approvedVerifications);
    } catch (error) {
        console.error('Failed to load approved verifications:', error);
        // Fallback to demo data
        const approvedVerifications = sampleVerifications.filter(v => v.status === 'approved');
        renderVerificationsList(container, approvedVerifications);
    }
}

async function loadRejectedVerifications() {
    const container = document.getElementById('rejectedVerifications');
    if (!container) return;
    
    try {
        if (API) {
            // Load from API using correct endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users?verificationStatus=rejected`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                verifications = data.verifications || [];
            } else {
                throw new Error('Failed to fetch rejected verifications');
            }
        } else {
            // Use demo data
            verifications = sampleVerifications;
        }
        
        const rejectedVerifications = verifications.filter(v => v.verificationStatus === 'rejected');
        renderVerificationsList(container, rejectedVerifications);
    } catch (error) {
        console.error('Failed to load rejected verifications:', error);
        // Fallback to demo data
        const rejectedVerifications = sampleVerifications.filter(v => v.status === 'rejected');
        renderVerificationsList(container, rejectedVerifications);
    }
}

function renderVerificationsList(container, verificationsList) {
    container.innerHTML = '';
    
    if (verificationsList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No verifications found.</p>';
        return;
    }
    
    verificationsList.forEach(verification => {
        const item = createVerificationItem(verification);
        container.appendChild(item);
    });
}

function createVerificationItem(user) {
    const item = document.createElement('div');
    item.className = 'verification-item';
    
    // Use your actual user data structure
    const userName = user.name || user.fullName || `${user.firstName} ${user.lastName}`;
    const userEmail = user.email;
    const userPhone = user.phone || user.phoneNumber;
    const verificationStatus = user.verificationStatus || 'pending';
    const submittedAt = user.createdAt || user.verificationSubmittedAt;
    
    item.innerHTML = `
        <div class="verification-info">
            <div class="verification-name">${userName}</div>
            <div class="verification-details">
                <span><i class="fas fa-envelope"></i> ${userEmail}</span>
                <span><i class="fas fa-phone"></i> ${userPhone}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(submittedAt)}</span>
                <span class="document-type ${verificationStatus}">
                    <i class="fas fa-id-card"></i> ${verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                </span>
            </div>
        </div>
        <div class="verification-actions">
            ${verificationStatus === 'pending' ? 
                `<button class="btn btn-primary" onclick="openReviewModal('${user._id}')">
                    <i class="fas fa-eye"></i> Review
                </button>` : 
                `<span style="color: ${verificationStatus === 'approved' ? '#10b981' : '#ef4444'}; font-weight: 500;">
                    ${verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                </span>`
            }
        </div>
    `;
    
    return item;
}

async function openReviewModal(userId) {
    try {
        if (API) {
            // Fetch user details from your API
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            
            currentVerification = await response.json();
        } else {
            // Use demo data
            currentVerification = verifications.find(v => v._id === userId);
        }
        
        if (!currentVerification) return;
        
        // Populate modal with user data
        const userName = currentVerification.name || currentVerification.fullName || `${currentVerification.firstName} ${currentVerification.lastName}`;
        document.getElementById('reviewUserName').textContent = userName;
        document.getElementById('reviewUserEmail').textContent = currentVerification.email;
        document.getElementById('reviewUserPhone').textContent = currentVerification.phone || currentVerification.phoneNumber;
        document.getElementById('reviewSubmitDate').textContent = formatDate(currentVerification.createdAt || currentVerification.verificationSubmittedAt);
        
        // Load documents (you'll need to adjust this based on your document structure)
        if (currentVerification.documents) {
            loadDocumentsInModal(currentVerification.documents, currentVerification.documentType);
        } else {
            // Show uploaded documents from your user structure
            loadUserDocumentsInModal(currentVerification);
        }
        
        // Show modal
        document.getElementById('reviewModal').classList.add('active');
    } catch (error) {
        console.error('Failed to open review modal:', error);
        showNotification('Failed to load user details', 'error');
    }
}

function loadDocumentsInModal(documents, documentType) {
    const documentGrid = document.getElementById('documentGrid');
    documentGrid.innerHTML = '';
    
    Object.entries(documents).forEach(([side, imageData]) => {
        const documentItem = document.createElement('div');
        documentItem.className = 'document-item';
        
        const sideName = side.charAt(0).toUpperCase() + side.slice(1);
        const documentTypeName = getDocumentTypeName(documentType);
        
        documentItem.innerHTML = `
            <img src="${imageData}" alt="${documentTypeName} ${sideName}" onclick="openImageModal('${imageData}', '${documentTypeName} ${sideName}')">
            <p>${documentTypeName} - ${sideName}</p>
        `;
        
        documentGrid.appendChild(documentItem);
    });
}

function loadUserDocumentsInModal(user) {
    const documentGrid = document.getElementById('documentGrid');
    documentGrid.innerHTML = '';
    
    // Display user's uploaded documents based on your app's structure
    const documents = [];
    
    // Add profile photo if available
    if (user.profilePhoto) {
        documents.push({
            type: 'Profile Photo',
            url: user.profilePhoto,
            side: 'Front'
        });
    }
    
    // Add Aadhar documents if available
    if (user.aadharFront) {
        documents.push({
            type: 'Aadhar Card',
            url: user.aadharFront,
            side: 'Front'
        });
    }
    
    if (user.aadharBack) {
        documents.push({
            type: 'Aadhar Card',
            url: user.aadharBack,
            side: 'Back'
        });
    }
    
    // Add PAN document if available
    if (user.panCard) {
        documents.push({
            type: 'PAN Card',
            url: user.panCard,
            side: 'Front'
        });
    }
    
    // Add Driving License documents if available
    if (user.drivingLicenseFront) {
        documents.push({
            type: 'Driving License',
            url: user.drivingLicenseFront,
            side: 'Front'
        });
    }
    
    if (user.drivingLicenseBack) {
        documents.push({
            type: 'Driving License',
            url: user.drivingLicenseBack,
            side: 'Back'
        });
    }
    
    // Display documents
    documents.forEach(doc => {
        const documentItem = document.createElement('div');
        documentItem.className = 'document-item';
        
        documentItem.innerHTML = `
            <img src="${doc.url}" alt="${doc.type} ${doc.side}" onclick="openImageModal('${doc.url}', '${doc.type} ${doc.side}')">
            <p>${doc.type} - ${doc.side}</p>
        `;
        
        documentGrid.appendChild(documentItem);
    });
    
    // If no documents found
    if (documents.length === 0) {
        documentGrid.innerHTML = '<p style="text-align: center; color: #64748b;">No documents uploaded yet.</p>';
    }
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    currentVerification = null;
    document.getElementById('reviewComments').value = '';
}

async function approveVerification() {
    if (!currentVerification) return;
    
    const comments = document.getElementById('reviewComments').value;
    
    try {
        if (API) {
            // Use your actual API endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${currentVerification._id}/verification-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    isVerified: true,
                    verificationStatus: 'approved',
                    verifiedAt: new Date().toISOString(),
                    adminComments: comments
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to approve verification');
            }
        } else {
            // Update demo data
            currentVerification.verificationStatus = 'approved';
            currentVerification.isVerified = true;
            currentVerification.verifiedAt = new Date().toISOString();
            currentVerification.reviewedBy = currentUser.username;
            currentVerification.comments = comments;
            
            const index = verifications.findIndex(v => v._id === currentVerification._id);
            if (index !== -1) {
                verifications[index] = currentVerification;
            }
        }
        
        // Close modal and refresh
        closeReviewModal();
        updateDashboard();
        showSection('pending');
        
        // Show success message
        showNotification('Verification approved successfully!', 'success');
    } catch (error) {
        console.error('Failed to approve verification:', error);
        showNotification('Failed to approve verification. Please try again.', 'error');
    }
}

async function rejectVerification() {
    if (!currentVerification) return;
    
    const comments = document.getElementById('reviewComments').value;
    
    if (!comments.trim()) {
        alert('Please provide a reason for rejection.');
        return;
    }
    
    try {
        if (API) {
            // Use your actual API endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${currentVerification._id}/verification-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    isVerified: false,
                    verificationStatus: 'rejected',
                    rejectedAt: new Date().toISOString(),
                    adminComments: comments
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to reject verification');
            }
        } else {
            // Update demo data
            currentVerification.verificationStatus = 'rejected';
            currentVerification.isVerified = false;
            currentVerification.rejectedAt = new Date().toISOString();
            currentVerification.reviewedBy = currentUser.username;
            currentVerification.comments = comments;
            
            const index = verifications.findIndex(v => v._id === currentVerification._id);
            if (index !== -1) {
                verifications[index] = currentVerification;
            }
        }
        
        // Close modal and refresh
        closeReviewModal();
        updateDashboard();
        showSection('pending');
        
        // Show success message
        showNotification('Verification rejected.', 'info');
    } catch (error) {
        console.error('Failed to reject verification:', error);
        showNotification('Failed to reject verification. Please try again.', 'error');
    }
}

function filterVerifications() {
    const documentType = document.getElementById('documentTypeFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredVerifications = [...verifications];
    
    // Filter by document type
    if (documentType) {
        filteredVerifications = filteredVerifications.filter(v => v.documentType === documentType);
    }
    
    // Filter by date
    if (dateFilter) {
        const today = new Date();
        filteredVerifications = filteredVerifications.filter(v => {
            const submittedDate = new Date(v.submittedAt);
            switch(dateFilter) {
                case 'today':
                    return isToday(submittedDate);
                case 'week':
                    return isThisWeek(submittedDate);
                case 'month':
                    return isThisMonth(submittedDate);
                default:
                    return true;
            }
        });
    }
    
    // Update the current section
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const container = activeSection.querySelector('.verifications-list');
        if (container) {
            const status = activeSection.id;
            const statusVerifications = filteredVerifications.filter(v => v.status === status);
            renderVerificationsList(container, statusVerifications);
        }
    }
}

function saveSettings() {
    const refreshInterval = document.getElementById('refreshInterval').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    
    // Save settings to localStorage
    localStorage.setItem('adminRefreshInterval', refreshInterval);
    localStorage.setItem('adminEmailNotifications', emailNotifications);
    
    showNotification('Settings saved successfully!', 'success');
}

// Utility functions
function getDocumentTypeName(type) {
    const types = {
        'aadhar': 'Aadhar Card',
        'pan': 'PAN Card',
        'driving': 'Driving License'
    };
    return types[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isThisWeek(date) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
}

function isThisMonth(date) {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Auto-refresh functionality
let refreshInterval = null;

function startAutoRefresh() {
    const interval = localStorage.getItem('adminRefreshInterval') || 30;
    refreshInterval = setInterval(() => {
        updateDashboard();
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            showSection(activeSection.id);
        }
    }, interval * 1000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Start auto-refresh when dashboard is shown
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('adminLoggedIn')) {
        startAutoRefresh();
    }
});

// Stop auto-refresh when page is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else if (localStorage.getItem('adminLoggedIn')) {
        startAutoRefresh();
    }
});
