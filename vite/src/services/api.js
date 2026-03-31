// API service for making requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('marketu_user') || 'null');
  return user?.token || null;
};

// Make API requests with common error handling
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Erro ao comunicar com servidor',
        data,
      };
    }

    return data.data || data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  verifyStudent: (studentData) =>
    apiRequest('/auth/verify-student', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  signup: (credentials) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),
};

// Users API
export const usersAPI = {
  getUserProfile: (userId) =>
    apiRequest(`/users/${userId}`, {
      method: 'GET',
    }),

  getVendorStats: (userId) =>
    apiRequest(`/users/${userId}/vendor-stats`, {
      method: 'GET',
    }),

  updateProfile: (userId, data) =>
    apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getVendorProducts: (userId, options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/users/${userId}/products${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },
};

// Products API
export const productsAPI = {
  listProducts: (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.category) params.append('category', options.category);
    if (options.condition) params.append('condition', options.condition);
    if (options.minPrice) params.append('minPrice', options.minPrice);
    if (options.maxPrice) params.append('maxPrice', options.maxPrice);
    if (options.search) params.append('search', options.search);
    if (options.sort) params.append('sort', options.sort);

    const queryString = params.toString();
    return apiRequest(`/products${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  getProduct: (productId) =>
    apiRequest(`/products/${productId}`, {
      method: 'GET',
    }),

  createProduct: (productData) =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (productId, data) =>
    apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (productId) =>
    apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    }),
};

// Messages API
export const messagesAPI = {
  listConversations: () =>
    apiRequest('/messages', {
      method: 'GET',
    }),

  getConversation: (userId, options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/messages/${userId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  sendMessage: (messageData) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),

  markAsRead: (messageId) =>
    apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    }),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/reviews/product/${productId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  createReview: (productId, reviewData) =>
    apiRequest(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
};

// Favorites API
export const favoritesAPI = {
  listFavorites: (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/favorites${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  addFavorite: (productId) =>
    apiRequest(`/favorites/${productId}`, {
      method: 'POST',
    }),

  removeFavorite: (productId) =>
    apiRequest(`/favorites/${productId}`, {
      method: 'DELETE',
    }),
};

// Cart API
export const cartAPI = {
  getCart: () =>
    apiRequest('/cart', {
      method: 'GET',
    }),

  addToCart: (itemData) =>
    apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  updateCartItem: (itemId, quantity) =>
    apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (itemId) =>
    apiRequest(`/cart/${itemId}`, {
      method: 'DELETE',
    }),
};

// Helper function to create test/sample products for development
export const createSampleProducts = async () => {
  try {
    // Use the /dev-seed endpoint that creates test data in development
    return apiRequest('/products/dev-seed', {
      method: 'POST',
    });
  } catch (err) {
    console.error('Error creating sample products:', err);
    throw err;
  }
};

export default apiRequest;
