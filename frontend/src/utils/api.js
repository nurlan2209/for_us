// frontend/src/utils/api.js
import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints object for better organization
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    verify: '/auth/verify',
  },
  
  // Projects endpoints
  projects: {
    getAll: '/projects',
    getById: (id) => `/projects/${id}`,
    create: '/projects',
    update: (id) => `/projects/${id}`,
    delete: (id) => `/projects/${id}`,
    adminGetAll: '/projects/admin/all',
  },
  
  // Upload endpoints
  upload: {
    image: '/upload/image',
    document: '/upload/document',
    multiple: '/upload/multiple',
    delete: (fileName) => `/upload/${fileName}`,
    getUrl: (fileName) => `/upload/url/${fileName}`,
  },
  
  // Settings endpoints
  settings: {
    getAll: '/settings',
    update: '/settings',
    getStudio: '/settings/studio',
    updateStudio: '/settings/studio',
    getContact: '/settings/contact',
    updateContact: '/settings/contact',
  },
  
  // Health check
  health: '/health',
};

// Helper functions for common API operations

/**
 * Auth API calls
 */
export const authAPI = {
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  logout: () => api.post(endpoints.auth.logout),
  refresh: (refreshToken) => api.post(endpoints.auth.refresh, { refreshToken }),
  getCurrentUser: () => api.get(endpoints.auth.me),
  verifyToken: () => api.get(endpoints.auth.verify),
};

/**
 * Projects API calls
 */
export const projectsAPI = {
  // Public endpoints
  getAll: (params = {}) => api.get(endpoints.projects.getAll, { params }),
  getById: (id) => api.get(endpoints.projects.getById(id)),
  
  // Admin endpoints
  adminGetAll: () => api.get(endpoints.projects.adminGetAll),
  create: (projectData) => api.post(endpoints.projects.create, projectData),
  update: (id, updateData) => api.put(endpoints.projects.update(id), updateData),
  delete: (id) => api.delete(endpoints.projects.delete(id)),
};

/**
 * Upload API calls
 */
export const uploadAPI = {
  uploadImage: (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post(endpoints.upload.image, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  
  uploadDocument: (file, onProgress) => {
    const formData = new FormData();
    formData.append('document', file);
    
    return api.post(endpoints.upload.document, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  
  uploadMultiple: (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return api.post(endpoints.upload.multiple, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  
  deleteFile: (fileName) => api.delete(endpoints.upload.delete(fileName)),
  getFileUrl: (fileName, expiry) => api.get(endpoints.upload.getUrl(fileName), {
    params: { expiry },
  }),
};

/**
 * Settings API calls
 */
export const settingsAPI = {
  getAll: () => api.get(endpoints.settings.getAll),
  update: (settings) => api.put(endpoints.settings.update, settings),
  getStudio: () => api.get(endpoints.settings.getStudio),
  updateStudio: (studioData) => api.put(endpoints.settings.updateStudio, studioData),
  getContact: () => api.get(endpoints.settings.getContact),
  updateContact: (contactData) => api.put(endpoints.settings.updateContact, contactData),
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized access');
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 422:
          console.error('Validation error:', data.details);
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', data.message || 'Unknown error');
      }
    } else if (error.request) {
      console.error('Network error: No response received');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for logging (development only)
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

export default api;