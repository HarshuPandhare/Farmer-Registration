/**
 * FARMER MANAGEMENT SYSTEM
 * Client-Side Logic
 */

// ==========================================
// CONFIGURATION
// ==========================================
// IMPORTANT: Replace this URL with your deployed Google Apps Script Web App URL
const API_BASE = 'https://script.google.com/macros/s/AKfycbwY89AGLtT0bggwRRuNMwU7TZT-5Ph4BPwSRLB_V3mauwyo-R0XpewqNbLlChj5C2Xh/exec';

// ==========================================
// API CLIENT & UI PREVIEW MODE
// ==========================================
async function apiCall(action, data = {}) {
  // If no API URL is set, we use "UI Preview Mode" and return mock data
  if (API_BASE === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (action === 'login') {
          resolve({ success: true, data: { id: data.id || 'admin', name: 'Preview User', role: data.role } });
        } else if (action === 'getAllFarmers') {
          resolve({
            success: true, data: [
              { farmerId: 'F001', name: 'Ramesh Kumar', mobileNo: '9876543210', village: 'Shirpur', district: 'Dhule', cropsGrown: 'Sugarcane, Maize', soilType: 'Medium', yieldResult: 'Increase Yield', registrationDate: '2023-10-15' },
              { farmerId: 'F002', name: 'Suresh Patil', mobileNo: '9123456780', village: 'Amalner', district: 'Jalgaon', cropsGrown: 'Soybean', soilType: 'Light', yieldResult: 'No Result', registrationDate: '2023-10-16' }
            ]
          });
        } else if (action === 'getFarmer') {
          resolve({ success: true, data: { farmerId: 'F001', name: 'Ramesh Kumar', mobileNo: '9876543210', village: 'Shirpur', district: 'Dhule', cropsGrown: 'Sugarcane, Maize', soilType: 'Medium', registrationDate: '2023-10-15' } });
        } else {
          resolve({ success: false, message: 'API URL not configured. Running in UI Preview Mode.' });
        }
      }, 600);
    });
  }

  try {
    const payload = {
      action: action,
      ...data
    };

    const response = await fetch(API_BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
      // Use text/plain to avoid CORS preflight issues with Google Apps Script
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to connect to the server. Please check your internet connection.');
  }
}

// ==========================================
// AUTH & SESSION
// ==========================================
function saveSession(userData) {
  sessionStorage.setItem('farmerPortalSession', JSON.stringify(userData));
}

function getSession() {
  const session = sessionStorage.getItem('farmerPortalSession');
  return session ? JSON.parse(session) : null;
}

function clearSession() {
  sessionStorage.removeItem('farmerPortalSession');
}

function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }

  if (requiredRole && session.role !== requiredRole) {
    window.location.href = session.role === 'admin' ? 'admin-dashboard.html' : 'farmer-dashboard.html';
    return null;
  }

  return session;
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

// ==========================================
// UI HELPERS
// ==========================================
function showLoading(show, text = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  if (show) {
    const textEl = overlay.querySelector('.loading-text');
    if (textEl) textEl.textContent = text;
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Icon based on type
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Remove toast after animation (3.8s total)
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ==========================================
// FILE HANDLING
// ==========================================
function setupPhotoPreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  input.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      // Validate file size (max 5MB)
      if (this.files[0].size > 5 * 1024 * 1024) {
        showToast('Image is too large. Please select an image under 5MB.', 'error');
        this.value = ''; // Clear selection
        preview.classList.remove('visible');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.classList.add('visible');
      };
      reader.readAsDataURL(this.files[0]);
    } else {
      preview.src = '';
      preview.classList.remove('visible');
    }
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Return only the base64 string, not the data URL prefix
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

// ==========================================
// IMAGE HELPERS
// ==========================================
// Google Drive's old 'uc?export=view&id=...' link often fails to render in an
// <img> tag (Drive shows a "can't preview" page instead of the image). This
// converts any Drive link (old or new, whatever format it's stored in) to the
// 'thumbnail' endpoint, which reliably returns the actual image. Safe to call
// on already-correct URLs or non-Drive URLs — they pass through unchanged.
function fixDriveImageUrl(url) {
  if (!url || !url.includes('drive.google.com')) return url;
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
  }
  return url;
}
