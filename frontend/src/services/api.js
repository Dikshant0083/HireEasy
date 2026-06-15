import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 20000,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      // forceRefresh=true ensures we always get a valid, non-expired token
      const token = await user.getIdToken(false);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.warn('⚠️ Could not get Firebase ID token:', e.message);
    }
  }
  return config;
});

// Handle errors — log 401s clearly
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('🔒 401 Unauthorized:', err.config?.url, '→', err.response?.data?.message);
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  syncUser: (formData) => api.post('/auth/sync', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMe: () => api.get('/auth/me'),
  testToken: () => api.get('/auth/test-token'),
};

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.patch('/user/profile', data),
  uploadResume: (formData) => api.post('/user/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Jobs
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  applyJob: (id) => api.post(`/jobs/${id}/apply`),
  saveJob: (id) => api.post(`/jobs/${id}/save`),
  uploadCSV: (formData) => api.post('/jobs/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Applications
export const applicationsAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  deleteApplication: (id) => api.delete(`/applications/${id}`),
};

// Alerts
export const alertsAPI = {
  getPreferences: () => api.get('/alerts/preferences'),
  updatePreferences: (data) => api.patch('/alerts/preferences', data),
  testEmail: () => api.post('/alerts/test-email'),
  testWhatsApp: () => api.post('/alerts/test-whatsapp'),
};

// Resume Builder
export const resumeAPI = {
  get: () => api.get('/resume-builder'),
  save: (data) => api.put('/resume-builder', data),
  setTemplate: (template) => api.patch('/resume-builder/template', { template }),
};

// Interviews
export const interviewsAPI = {
  getAll: () => api.get('/interviews'),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.patch(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
};

export default api;
