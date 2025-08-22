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
        
        // Add additional user details to the modal
        const userDetailsDiv = document.querySelector('.user-details');
        if (userDetailsDiv) {
            // Add more user details if available
            let additionalDetails = '';
            
            if (currentVerification.dateOfBirth) {
                additionalDetails += `<p><strong>Date of Birth:</strong> ${currentVerification.dateOfBirth}</p>`;
            }
            
            if (currentVerification.gender) {
                additionalDetails += `<p><strong>Gender:</strong> ${currentVerification.gender}</p>`;
            }
            
            if (currentVerification.address) {
                additionalDetails += `<p><strong>Address:</strong> ${currentVerification.address}</p>`;
            }
            
            if (currentVerification.city) {
                additionalDetails += `<p><strong>City:</strong> ${currentVerification.city}</p>`;
            }
            
            if (currentVerification.state) {
                additionalDetails += `<p><strong>State:</strong> ${currentVerification.state}</p>`;
            }
            
            if (currentVerification.pincode) {
                additionalDetails += `<p><strong>Pincode:</strong> ${currentVerification.pincode}</p>`;
            }
            
            // Insert additional details after the existing ones
            if (additionalDetails) {
                const submitDateElement = document.getElementById('reviewSubmitDate').parentElement;
                submitDateElement.insertAdjacentHTML('afterend', additionalDetails);
            }
        }
        
        // Load documents from user structure
        if (currentVerification.documents) {
            loadUserDocumentsInModal(currentVerification);
        } else {
            // Fallback to old document structure
            loadDocumentsInModal(currentVerification.documents, currentVerification.documentType);
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
    
    console.log('=== LOADING USER DOCUMENTS ===');
    console.log('User object:', user);
    console.log('User ID:', user._id);
    console.log('User name:', user.name);
    console.log('User phone:', user.phone);
    console.log('Profile image:', user.profileImage);
    console.log('User documents structure:', user.documents);
    console.log('Documents JSON:', JSON.stringify(user.documents, null, 2));
    
    // Display user's uploaded documents based on your app's structure
    const documents = [];
    
    // Add profile photo if available
    if (user.profileImage || user.profilePhoto) {
        const profileUrl = user.profileImage || user.profilePhoto;
        documents.push({
            type: 'Profile Photo',
            url: profileUrl,
            side: 'Front'
        });
    }
    
    // Add documents from nested structure
    if (user.documents) {
        // Aadhar documents
        if (user.documents.aadhaar) {
            if (user.documents.aadhaar.front) {
                documents.push({
                    type: 'Aadhar Card',
                    url: user.documents.aadhaar.front,
                    side: 'Front'
                });
            }
            if (user.documents.aadhaar.back) {
                documents.push({
                    type: 'Aadhar Card',
                    url: user.documents.aadhaar.back,
                    side: 'Back'
                });
            }
        }
        
        // PAN document
        if (user.documents.pan && user.documents.pan.front) {
            documents.push({
                type: 'PAN Card',
                url: user.documents.pan.front,
                side: 'Front'
            });
        }
        
        // Driving License documents
        if (user.documents.drivingLicense) {
            if (user.documents.drivingLicense.front) {
                documents.push({
                    type: 'Driving License',
                    url: user.documents.drivingLicense.front,
                    side: 'Front'
                });
            }
            if (user.documents.drivingLicense.back) {
                documents.push({
                    type: 'Driving License',
                    url: user.documents.drivingLicense.back,
                    side: 'Back'
                });
            }
        }
    }
    
    // Also check for flat document fields (backward compatibility)
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
    
    if (user.panCard) {
        documents.push({
            type: 'PAN Card',
            url: user.panCard,
            side: 'Front'
        });
    }
    
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
        console.log('Processing document:', doc);
            const documentItem = document.createElement('div');
            documentItem.className = 'document-item';
            
            // Add error handling for image loading
            const img = document.createElement('img');
            img.alt = `${doc.type} ${doc.side}`;
            img.onclick = () => openImageModal(doc.url, `${doc.type} ${doc.side}`);
            
            console.log('Document URL:', doc.url);
            console.log('Document type:', doc.type);
            console.log('Document side:', doc.side);
            
            // Add cache-busting parameter to force fresh load
            const imageUrl = doc.url + (doc.url.includes('?') ? '&' : '?') + '_t=' + Date.now();
            console.log('Final image URL with cache busting:', imageUrl);
            
            img.onerror = (error) => {
                console.error('Failed to load image:', doc.url);
                console.error('Error details:', error);
                console.error('Image element:', img);
                img.style.display = 'none';
                documentItem.innerHTML = `
                    <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px;">
                        <p style="color: #666; margin: 0;">Image not accessible</p>
                        <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">URL: ${doc.url}</p>
                        <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Final URL: ${imageUrl}</p>
                    </div>
                    <p>${doc.type} - ${doc.side}</p>
                `;
            };
            img.onload = () => {
                console.log('Successfully loaded image:', doc.url);
                console.log('Image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
            };
            img.src = imageUrl;
        
        documentItem.appendChild(img);
        
        const label = document.createElement('p');
        label.textContent = `${doc.type} - ${doc.side}`;
        documentItem.appendChild(label);
        
        documentGrid.appendChild(documentItem);
    });
    
    // Debug: Show what documents were found
    console.log('Total documents found:', documents.length);
    documents.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, doc);
    });
    
    // If no documents found
    if (documents.length === 0) {
        documentGrid.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 20px;">
                <p>No documents uploaded yet.</p>
                <p style="font-size: 12px; color: #999;">User ID: ${user._id}</p>
                <p style="font-size: 12px; color: #999;">Profile Image: ${user.profileImage || 'None'}</p>
                <p style="font-size: 12px; color: #999;">Documents Object: ${JSON.stringify(user.documents, null, 2)}</p>
            </div>
        `;
    } else {
        // Add a summary of documents found
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = 'background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 8px; font-size: 12px; color: #666;';
        summaryDiv.innerHTML = `
            <strong>Documents Summary:</strong><br>
            • Profile Photo: ${user.profileImage ? '✅ Uploaded' : '❌ Missing'}<br>
            • Aadhar Front: ${user.documents?.aadhaar?.front ? '✅ Uploaded' : '❌ Missing'}<br>
            • Aadhar Back: ${user.documents?.aadhaar?.back ? '✅ Uploaded' : '❌ Missing'}<br>
            • PAN Front: ${user.documents?.pan?.front ? '✅ Uploaded' : '❌ Missing'}<br>
            • Driving License Front: ${user.documents?.drivingLicense?.front ? '✅ Uploaded' : '❌ Missing'}<br>
            • Driving License Back: ${user.documents?.drivingLicense?.back ? '✅ Uploaded' : '❌ Missing'}<br>
            <br><strong>Note:</strong> Documents are now stored on Cloudinary and should be accessible.
        `;
        documentGrid.insertBefore(summaryDiv, documentGrid.firstChild);
    }
}

// Function to fix document URLs
function fixDocumentUrl(url) {
    if (!url) return '';
    
    console.log('Original URL:', url);
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // If it's a file:// URL, use the document proxy
    if (url.startsWith('file://')) {
        return `${CONFIG.API_BASE_URL.replace('/api', '')}/admin/document-proxy?url=${encodeURIComponent(url)}`;
    }
    
    // If it's a relative path starting with /uploads, add server base URL
    if (url.startsWith('/uploads/')) {
        return `https://freelancer-backend-jv21.onrender.com${url}`;
    }
    
    // If it's a relative path, add server base URL
    if (url.startsWith('/')) {
        return `https://freelancer-backend-jv21.onrender.com${url}`;
    }
    
    // If it's just a filename, assume it's in uploads folder
    if (!url.includes('/')) {
        return `https://freelancer-backend-jv21.onrender.com/uploads/${url}`;
    }
    
    // Default: add server base URL
    return `https://freelancer-backend-jv21.onrender.com/${url}`;
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    currentVerification = null;
    document.getElementById('reviewComments').value = '';
    
    // Clear additional user details that were dynamically added
    const userDetailsDiv = document.querySelector('.user-details');
    if (userDetailsDiv) {
        const additionalDetails = userDetailsDiv.querySelectorAll('p:not(:nth-child(-n+4))');
        additionalDetails.forEach(detail => detail.remove());
    }
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

async function deleteUser() {
    if (!currentVerification) return;
    
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone and will remove all user data from the database.');
    
    if (!confirmed) {
        return;
    }
    
    try {
        if (API) {
            // Use the existing delete user endpoint
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/delete-user/${currentVerification._id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
        } else {
            // Update demo data - remove the verification from the list
            const index = verifications.findIndex(v => v._id === currentVerification._id);
            if (index !== -1) {
                verifications.splice(index, 1);
            }
        }
        
        // Close modal and refresh
        closeReviewModal();
        updateDashboard();
        showSection('pending');
        
        // Show success message
        showNotification('User deleted successfully!', 'success');
    } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('Failed to delete user. Please try again.', 'error');
    }
}

async function searchUserByPhone() {
    const phoneNumber = document.getElementById('phoneSearch').value.trim();
    
    if (!phoneNumber) {
        showNotification('Please enter a phone number to search', 'error');
        return;
    }
    
    try {
        if (API) {
            // Search user by phone number
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/users?phone=${phoneNumber}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to search user');
            }
            
            const data = await response.json();
            
            if (data.success && data.user) {
                // Open the review modal with the found user
                currentVerification = data.user;
                await openReviewModal(data.user._id);
                showNotification('User found!', 'success');
            } else {
                showNotification('User not found with this phone number', 'error');
            }
        } else {
            // Demo mode - search in sample data
            const foundUser = sampleVerifications.find(v => v.userPhone === phoneNumber);
            if (foundUser) {
                currentVerification = foundUser;
                await openReviewModal(foundUser._id);
                showNotification('User found!', 'success');
            } else {
                showNotification('User not found with this phone number', 'error');
            }
        }
    } catch (error) {
        console.error('Failed to search user:', error);
        showNotification('Failed to search user. Please try again.', 'error');
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

// Freelancer ID Assignment Function
async function assignFreelancerId() {
    try {
        const button = document.getElementById('assignFreelancerIdBtn');
        const originalText = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
        
        const response = await fetch(`${API}/admin/assign-freelancer-id`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`✅ ${data.message}`, 'success');
            if (data.user) {
                showNotification(`User: ${data.user.name} | ID: ${data.user.freelancerId}`, 'success');
            }
        } else {
            showNotification(`❌ ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Assign freelancer ID error:', error);
        showNotification('❌ Failed to assign freelancer ID', 'error');
    } finally {
        const button = document.getElementById('assignFreelancerIdBtn');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-id-card"></i> Assign Freelancer ID';
    }
}

// Add event listener for the assign freelancer ID button
document.addEventListener('DOMContentLoaded', function() {
    const assignButton = document.getElementById('assignFreelancerIdBtn');
    if (assignButton) {
        assignButton.addEventListener('click', assignFreelancerId);
    }
});
