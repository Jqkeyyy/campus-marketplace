import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getUserById: (userId) => api.get(`/users/${userId}`),
};

// Listings API
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (listingId) => api.get(`/listings/${listingId}`),
  create: (listingData) => api.post('/listings', listingData),
  update: (listingId, listingData) => api.put(`/listings/${listingId}`, listingData),
  delete: (listingId) => api.delete(`/listings/${listingId}`),
  getMyListings: () => api.get('/listings/user/my-listings'),
  getUserListings: (userId) => api.get(`/listings/user/${userId}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (categoryId) => api.get(`/categories/${categoryId}`),
  getTopCategories: (limit = 10) => api.get('/categories/stats/top', { params: { limit } }),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  check: (listingId) => api.get(`/favorites/check/${listingId}`),
  add: (listingId) => api.post(`/favorites/${listingId}`),
  remove: (listingId) => api.delete(`/favorites/${listingId}`),
  getCount: (listingId) => api.get(`/favorites/count/${listingId}`),
  getPopular: (limit = 10) => api.get('/favorites/stats/popular', { params: { limit } }),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (listingId, otherUserId) => 
    api.get(`/messages/listing/${listingId}/user/${otherUserId}`),
  send: (messageData) => api.post('/messages', messageData),
  delete: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// Images API
export const imagesAPI = {
  getByListing: (listingId) => api.get(`/images/listing/${listingId}`),
  add: (imageData) => api.post('/images', imageData),
  setPrimary: (imageId) => api.patch(`/images/${imageId}/primary`),
  delete: (imageId) => api.delete(`/images/${imageId}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: () => api.get('/users'),
  updateUserStatus: (userId, status) => api.patch(`/users/${userId}/status`, { status }),

  // Listing management (uses existing endpoints with admin privileges)
  getAllListings: (params) => api.get('/listings', { params: { ...params, include_all: true } }),
  deleteListing: (listingId) => api.delete(`/listings/${listingId}`),

  // Category management
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (categoryId, categoryData) => api.put(`/categories/${categoryId}`, categoryData),
  deleteCategory: (categoryId) => api.delete(`/categories/${categoryId}`),
};

export default api;
