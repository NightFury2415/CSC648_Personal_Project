// src/utils/axiosConfig.js
import axios from 'axios';
import AuthHelper from './authHelper';

// Request interceptor to add auth token
axios.interceptors.request.use(
  config => {
    // Add auth token to all requests if available
    const token = AuthHelper.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Don't retry if this is already a retry or if it's a refresh token request
    if (originalRequest._retry || originalRequest.url.includes('/refresh-token')) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      const errorData = error.response?.data;
      const errorCode = errorData?.code;

      // If token expired and we haven't already tried to refresh
      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const newToken = await AuthHelper.refreshToken();
          // Update the authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh failed with an action code 'logout', the AuthHelper will handle the logout
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // For other 401 errors that require logout
      if (errorData?.action === 'logout') {
        AuthHelper.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'ADMIN_REQUIRED') {
        // Redirect to home or show error message
        alert('Admin privileges required for this action');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axios;