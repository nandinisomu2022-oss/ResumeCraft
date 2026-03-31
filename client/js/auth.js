/* auth.js - Shared authentication utilities */

const API_BASE = 'http://localhost:5000/api';

const Auth = {
  getToken: () => localStorage.getItem('rc_token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('rc_user')); } catch { return null; }
  },
  setAuth: (token, user) => {
    localStorage.setItem('rc_token', token);
    localStorage.setItem('rc_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('rc_token');
    localStorage.removeItem('rc_user');
  },
  isLoggedIn: () => !!localStorage.getItem('rc_token'),
  requireAuth: () => {
    if (!Auth.isLoggedIn()) window.location.href = 'login.html';
  },
  apiHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Auth.getToken()}`,
  }),
};

// Handle Google OAuth token from URL params
function handleGoogleCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const name = params.get('name');
  const avatar = params.get('avatar');
  if (token) {
    localStorage.setItem('rc_token', token);
    localStorage.setItem('rc_user', JSON.stringify({ name, avatar }));
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// Global logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    Auth.clearAuth();
    window.location.href = 'login.html';
  }
}

// Handle Google callback on dashboard load
handleGoogleCallback();

// Export for usage
window.Auth = Auth;
window.logout = logout;
window.API_BASE = API_BASE;
