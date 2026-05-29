import type {
  ProductSearchOptions,
  ProductSearchResponse,
  ProductSuggestion,
  ProductSuggestionOptions,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  const user = JSON.parse(window.localStorage.getItem('marketu_user') || 'null');
  return user?.token || null;
};

const getErrorMessage = (data: any, rawText: string): string => {
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);
  if (rawText && typeof rawText === 'string' && rawText.trim()) return rawText.trim();
  return 'Erro ao comunicar com servidor';
};

async function apiRequest(endpoint: string, options: any = {}) {
  const token = getToken();
  const headers: any = {
    ...options.headers,
  };

<<<<<<< HEAD
=======
  // Only set Content-Type if not explicitly skipped (for FormData uploads)
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
  if (!options.skipContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

<<<<<<< HEAD
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
      const error = new Error(getErrorMessage(data, rawText)) as Error & {
        status?: number;
        data?: unknown;
      };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (data === null || data === undefined) {
      return {};
    }

    if (data && typeof data === 'object' && 'data' in data) {
      return data.data ?? data;
    }

    return data;
=======
    // Handle non-JSON responses (e.g., HTML error pages)
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Non-JSON response from server' };
    }

    if (!response.ok) {
      const message = data?.error || 'Erro ao comunicar com servidor';
      const err = new Error(message) as Error & { status?: number; data?: unknown };
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data.data || data;
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
  } catch (error: any) {
    const errorMessage = error?.message || error?.error || 'Erro desconhecido';
    console.error('API Error:', errorMessage, error);
    throw error;
  }
}

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

  createProduct: (productData: any) => {
<<<<<<< HEAD
=======
    // Check if productData is FormData (for multipart uploads with files)
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    if (productData instanceof FormData) {
      return apiRequest('/products', {
        method: 'POST',
        body: productData,
<<<<<<< HEAD
        skipContentType: true,
      });
    }

=======
        skipContentType: true, // Let browser set Content-Type with boundary
      });
    }
    
    // Otherwise, send as JSON
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

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

export const createSampleProducts = async () => {
  try {
    return apiRequest('/products/dev-seed', {
      method: 'POST',
    });
  } catch (err) {
    console.error('Error creating sample products:', err);
    throw err;
  }
};

export default apiRequest;
