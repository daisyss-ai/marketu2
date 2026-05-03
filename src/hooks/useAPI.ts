'use client';
import { useState, useEffect, useCallback } from 'react';
import { usersAPI, productsAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Product, User } from '../types';

// Hook for fetching user profile
export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

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
          // Not a vendor or error fetching stats, that's fine - set default stats
          setStats({
            stats: {
              avgRating: profileData?.rating || 0,
              reviewCount: profileData?.total_reviews || 0,
              totalProducts: 0,
              totalOrders: 0,
              totalRevenue: 0,
            },
          });
        }
      } catch (err: any) {
        const errorMessage = err?.message || err?.error || 'Erro ao carregar perfil';
        setError(errorMessage);
        console.error('Error fetching profile:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, stats, loading, error };
};

// Hook for fetching user's products
export const useUserProducts = (userId?: string, page = 1, limit = 20) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersAPI.getVendorProducts(userId, { page, limit });
        setProducts(data.products || []);
        setPagination(data.pagination);
      } catch (err: any) {
        const errorMessage = err?.message || err?.error || 'Erro ao carregar produtos';
        setError(errorMessage);
        console.error('Error fetching products:', errorMessage);
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadProduct = useCallback(async (productData: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add product fields
      formData.append('title', productData.title);
      formData.append('description', productData.description || '');
      formData.append('category', productData.category);
      formData.append('price', String(productData.price));
      
      // Add image files
      if (productData.files && Array.isArray(productData.files)) {
        productData.files.forEach((file: File) => {
          formData.append('images', file);
        });
      }

      const result = await productsAPI.createProduct(formData);
      setSuccess(true);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || err?.error || 'Erro ao publicar produto';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err: any) {
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
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = useCallback(async (productId: string | number) => {
    try {
      setLoading(true);
      setError(null);
      await productsAPI.deleteProduct(String(productId));
      return true;
    } catch (err: any) {
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
  const [error, setError] = useState<string | null>(null);

  const uploadImages = useCallback(async (files: File[]) => {
    try {
      setUploading(true);
      setError(null);

      // For now, create object URLs for preview
      // In production, upload to cloud storage (AWS S3, Cloudinary, etc)
      const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));

      return imageUrls;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer upload de imagens';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadImages, uploading, error };
};
