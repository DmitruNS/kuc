// Get the current environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Base API URL configuration
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8080'
  : 'https://kuckuc.rs';

// Helper function for API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function for file URLs
export const getFileUrl = (filePath: string): string => {
  return `${API_BASE_URL}/uploads/${filePath}`;
};