// API service for making requests to the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Get token from localStorage
const getToken = () => {
  if (typeof window === 'undefined') return null;
  const user = JSON.parse(window.localStorage.getItem('marketu_user') || 'null');
  return user?.token || null;
};

// Make API requests with common error handling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiRequest(endpoint: string, options: any = {}) {
  const token = getToken();
  const headers: any = {
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

    // Check if response is ok and contains JSON
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `Erro HTTP ${response.status}` };
      }
      throw {
        status: response.status,
        message: errorData.error || 'Erro ao comunicar com servidor',
        data: errorData,
      };
    }

    // Try to parse JSON, handle non-JSON responses
    let data;
    try {
      data = await response.json();
    } catch {
      throw {
        status: response.status,
        message: 'Resposta inválida do servidor (não é JSON)',
        data: null,
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
  verifyStudent: (studentData: any) =>
    apiRequest('/auth/verify-student', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  signup: (credentials: any) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  login: (credentials: any) =>
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
  getUserProfile: (userId: string) =>
    apiRequest(`/users/${userId}`, {
      method: 'GET',
    }),

  getVendorStats: (userId: string) =>
    apiRequest(`/users/${userId}/vendor-stats`, {
      method: 'GET',
    }),

  updateProfile: (userId: string, data: any) =>
    apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getVendorProducts: (userId: string, options: any = {}) => {
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
  listProducts: (options: any = {}) => {
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

  getProduct: (productId: string) =>
    apiRequest(`/products/${productId}`, {
      method: 'GET',
    }),

  createProduct: (productData: any) =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (productId: string, data: any) =>
    apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (productId: string) =>
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

  getConversation: (userId: string, options: any = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/messages/${userId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  sendMessage: (messageData: any) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),

  markAsRead: (messageId: string) =>
    apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    }),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId: string, options: any = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/reviews/product/${productId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  createReview: (productId: string, reviewData: any) =>
    apiRequest(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
};

// Favorites API
export const favoritesAPI = {
  listFavorites: (options: any = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    const queryString = params.toString();
    return apiRequest(`/favorites${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  },

  addFavorite: (productId: string) =>
    apiRequest(`/favorites/${productId}`, {
      method: 'POST',
    }),

  removeFavorite: (productId: string) =>
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

  addToCart: (itemData: any) =>
    apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (itemId: string) =>
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
