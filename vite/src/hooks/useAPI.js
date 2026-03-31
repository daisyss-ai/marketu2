import { useState, useEffect, useCallback } from 'react';
import { usersAPI, productsAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Hook for fetching user profile
export const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await usersAPI.getUserProfile(userId);
        setProfile(profileData);

        // Try to fetch vendor stats if user is a vendor
        try {
          const statsData = await usersAPI.getVendorStats(userId);
          setStats(statsData);
        } catch (err) {
          // Not a vendor, that's fine
        }
      } catch (err) {
        setError(err.message || 'Erro ao carregar perfil');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, stats, loading, error };
};

// Hook for fetching user's products
export const useUserProducts = (userId, page = 1, limit = 20) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersAPI.getVendorProducts(userId, { page, limit });
        setProducts(data.products || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message || 'Erro ao carregar produtos');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userId, page, limit]);

  return { products, pagination, loading, error };
};

// Hook for uploading/creating a product
export const useProductUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const uploadProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await productsAPI.createProduct(productData);
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao publicar produto';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadProduct, loading, error, success };
};

// Hook for getting current authenticated user
export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        // Update auth store if needed
        if (userData) {
          useAuthStore.setState({
            user: {
              ...authUser,
              ...userData,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser?.id]);

  return { user: user || authUser, loading, error };
};

// Hook for deleting a product
export const useDeleteProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      await productsAPI.deleteProduct(productId);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao deletar produto';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteProduct, loading, error };
};

// Hook for image uploads (mock - can be replaced with real image hosting)
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImages = useCallback(async (files) => {
    try {
      setUploading(true);
      setError(null);

      // For now, create object URLs for preview
      // In production, upload to cloud storage (AWS S3, Cloudinary, etc)
      const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));

      return imageUrls;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao fazer upload de imagens';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadImages, uploading, error };
};
