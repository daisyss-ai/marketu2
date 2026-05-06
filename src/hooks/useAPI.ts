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

  const uploadProduct = useCallback(async (productData: {
    title: string;
    description: string;
    category_id: string;
    condition: 'new' | 'used' | 'digital';
    price: number;
    is_free: boolean;
    quantity: number;
    files: File[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const createRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: productData.title,
          description: productData.description,
          category_id: productData.category_id,
          condition: productData.condition,
          price: productData.price,
          is_free: productData.is_free,
          quantity: productData.quantity,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error((createJson && (createJson.error || createJson.message)) || 'Erro ao criar produto');
      }

      const productId = String(createJson?.data?.id || '');
      const sellerId = String(createJson?.data?.seller_id || '');
      if (!productId || !sellerId) throw new Error('Resposta invÃ¡lida do servidor');

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const bucket = 'product-media';

      const mediaToAdd: Array<{
        url: string;
        filename: string;
        size_bytes: number;
        position: number;
        is_preview: boolean;
      }> = [];

      const files = Array.isArray(productData.files) ? productData.files.slice(0, 5) : [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${sellerId}/${productId}/${file.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
          cacheControl: '3600',
        });
        if (uploadError) {
          const msg = uploadError.message || 'Erro desconhecido';
          if (msg.toLowerCase().includes('row-level security')) {
            throw new Error(
              "Falha ao enviar imagem: permissÃ£o negada (RLS) no Storage. Crie/ajuste a policy do bucket `product-media` para permitir INSERT a utilizadores autenticados no caminho `{auth.uid()}/{product_id}/*`."
            );
          }
          throw new Error(`Falha ao enviar imagem: ${msg}`);
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        if (!publicUrl) throw new Error('Falha ao obter URL pÃºblica da imagem');

        mediaToAdd.push({
          url: publicUrl,
          filename: file.name,
          size_bytes: file.size,
          position: i,
          is_preview: i === 0,
        });
      }

      const patchRes = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ media_add: mediaToAdd }),
      });
      const patchJson = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) throw new Error((patchJson && (patchJson.error || patchJson.message)) || 'Erro ao salvar imagens');

      setSuccess(true);
      return { id: productId };
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
