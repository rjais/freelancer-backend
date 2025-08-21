class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.currentTab = 'pending';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    checkAuth() {
        if (this.token) {
            this.verifyToken();
        } else {
            this.showLoginScreen();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/verify-token`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showDashboard();
                this.loadDashboardData();
            } else {
                this.showLoginScreen();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.showLoginScreen();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('adminToken', this.token);
                this.showDashboard();
                this.loadDashboardData();
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    handleLogout() {
        this.token = null;
        localStorage.removeItem('adminToken');
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadStats(),
            this.loadVerifications()
        ]);
    }

    async loadStats() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    updateStats(stats) {
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('pending-verifications').textContent = stats.pendingVerifications || 0;
        document.getElementById('approved-verifications').textContent = stats.approvedVerifications || 0;
        document.getElementById('rejected-verifications').textContent = stats.rejectedVerifications || 0;
    }

    async loadVerifications() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/verifications/${this.currentTab}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderVerifications(data.verifications);
            }
        } catch (error) {
            console.error('Failed to load verifications:', error);
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Load verifications for the selected tab
        this.loadVerifications();
    }

    renderVerifications(verifications) {
        const container = document.getElementById('verifications-list');
        
        if (verifications.length === 0) {
            container.innerHTML = '<p>No verifications found.</p>';
            return;
        }

        container.innerHTML = verifications.map(verification => this.createVerificationHTML(verification)).join('');
        
        // Add event listeners to action buttons
        this.setupVerificationActions();
    }

    createVerificationHTML(verification) {
        const statusClass = `status-${verification.status}`;
        const documents = verification.documents || {};
        
        let documentsHTML = '';
        if (documents.aadhaar) {
            documentsHTML += `
                <div><strong>Aadhaar:</strong> 
                    <a href="${CONFIG.API_BASE_URL.replace('/api', '')}${documents.aadhaar.front}" target="_blank" class="document-link">Front</a>
                    <a href="${CONFIG.API_BASE_URL.replace('/api', '')}${documents.aadhaar.back}" target="_blank" class="document-link">Back</a>
                </div>
            `;
        }
        if (documents.pan) {
            documentsHTML += `
                <div><strong>PAN:</strong> 
                    <a href="${CONFIG.API_BASE_URL.replace('/api', '')}${documents.pan.front}" target="_blank" class="document-link">Front</a>
                </div>
            `;
        }
        if (documents.drivingLicense) {
            documentsHTML += `
                <div><strong>Driving License:</strong> 
                    <a href="${CONFIG.API_BASE_URL.replace('/api', '')}${documents.drivingLicense.front}" target="_blank" class="document-link">Front</a>
                    <a href="${CONFIG.API_BASE_URL.replace('/api', '')}${documents.drivingLicense.back}" target="_blank" class="document-link">Back</a>
                </div>
            `;
        }

        const actionsHTML = verification.status === 'pending' ? `
            <div class="actions">
                <button class="btn btn-success approve-btn" data-id="${verification._id}">Approve</button>
                <button class="btn btn-danger reject-btn" data-id="${verification._id}">Reject</button>
            </div>
            <div class="comments">
                <textarea placeholder="Add comments (required for rejection)..." class="comments-textarea"></textarea>
            </div>
        ` : '';

        return `
            <div class="verification-item">
                <h3>${verification.userName}</h3>
                <p><strong>Email:</strong> ${verification.userEmail}</p>
                <p><strong>Phone:</strong> ${verification.userPhone}</p>
                <p><strong>Status:</strong> <span class="${statusClass}">${verification.status.toUpperCase()}</span></p>
                <p><strong>Submitted:</strong> ${new Date(verification.submittedAt).toLocaleDateString()}</p>
                ${verification.deliveryWork ? '<p><strong>Delivery Work:</strong> Yes</p>' : ''}
                ${verification.comments ? `<p><strong>Comments:</strong> ${verification.comments}</p>` : ''}
                <div class="documents">
                    <strong>Documents:</strong>
                    ${documentsHTML}
                </div>
                ${actionsHTML}
            </div>
        `;
    }

    setupVerificationActions() {
        // Approve buttons
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleApprove(e.target.dataset.id));
        });

        // Reject buttons
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleReject(e.target.dataset.id));
        });
    }

    async handleApprove(verificationId) {
        const verificationItem = document.querySelector(`[data-id="${verificationId}"]`).closest('.verification-item');
        const comments = verificationItem.querySelector('.comments-textarea')?.value || 'Approved by admin';

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/verifications/${verificationId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comments })
            });

            if (response.ok) {
                alert('Verification approved successfully!');
                this.loadDashboardData();
            } else {
                const data = await response.json();
                alert('Failed to approve: ' + data.message);
            }
        } catch (error) {
            console.error('Approve error:', error);
            alert('Failed to approve verification');
        }
    }

    async handleReject(verificationId) {
        const verificationItem = document.querySelector(`[data-id="${verificationId}"]`).closest('.verification-item');
        const comments = verificationItem.querySelector('.comments-textarea')?.value;

        if (!comments || comments.trim() === '') {
            alert('Comments are required for rejection');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/verifications/${verificationId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comments })
            });

            if (response.ok) {
                alert('Verification rejected successfully!');
                this.loadDashboardData();
            } else {
                const data = await response.json();
                alert('Failed to reject: ' + data.message);
            }
        } catch (error) {
            console.error('Reject error:', error);
            alert('Failed to reject verification');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
