import type {
  ProductSearchOptions,
  ProductSearchResponse,
  ProductSuggestion,
  ProductSuggestionOptions,
} from '../types';

// API service for making requests to the backend
// Prefer relative URL in the browser to avoid hardcoding localhost in production.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Get token from localStorage
const getToken = () => {
  if (typeof window === 'undefined') return null;
  const user = JSON.parse(window.localStorage.getItem('marketu_user') || 'null');
  return user?.token || null;
};

// Helper function to extract error message
const getErrorMessage = (data: any, rawText: string): string => {
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);
  if (rawText && typeof rawText === 'string' && rawText.trim()) {
    return rawText.trim();
  }
  return 'Erro ao comunicar com servidor';
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

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    let data: any = null;
    
    try {
      data = contentType.includes('application/json') && rawText
        ? JSON.parse(rawText)
        : rawText
          ? { data: rawText }
          : null;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, rawText);
      data = { data: rawText };
    }

    if (!response.ok) {
      const error = new Error(getErrorMessage(data, rawText)) as any;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    // Se não há resposta, retornar o objeto vazio ou a estrutura esperada
    if (data === null || data === undefined) {
      return {};
    }
    
    // Se a resposta tem propriedade 'data', retornar ela
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data || data;
    }
    
    // Caso contrário retornar os dados diretamente
    return data;
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
  listProducts: (options: ProductSearchOptions = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.category) params.append('category', options.category);
    if (options.condition) params.append('condition', options.condition);
    if (typeof options.minPrice === 'number') params.append('minPrice', String(options.minPrice));
    if (typeof options.maxPrice === 'number' && Number.isFinite(options.maxPrice)) {
      params.append('maxPrice', String(options.maxPrice));
    }
    if (typeof options.rating === 'number') params.append('rating', String(options.rating));
    if (options.search) params.append('search', options.search);
    if (options.gradeLevel) params.append('gradeLevel', String(options.gradeLevel));
    if (options.subject) params.append('subject', options.subject);
    if (options.productType) params.append('productType', options.productType);
    if (options.location) params.append('location', options.location);
    if (options.sort) params.append('sort', options.sort);

    const queryString = params.toString();
    return apiRequest(`/products${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    }) as Promise<ProductSearchResponse>;
  },

  suggest: (query: string, options: ProductSuggestionOptions & { signal?: AbortSignal } = {}) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (options.limit) params.append('limit', String(options.limit));
    const queryString = params.toString();
    return apiRequest(`/products/suggest${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
      signal: options.signal,
    }) as Promise<{ suggestions: ProductSuggestion[] }>;
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
