/**
 * Product service layer
 * Handles product CRUD operations, upload, and filtering
 */

import { createClient as createServerClient } from '@/services/supabase/server';
import { handleSupabaseError } from '@/services/supabase/utils';
import type { Product, ProductResponse } from '@/types';

export interface ProductServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new product listing
 */
export async function createProduct(
  sellerId: string,
  productData: {
    title: string;
    description: string;
    category: string;
    price: number;
    condition: 'new' | 'like_new' | 'good' | 'fair';
  }
): Promise<ProductServiceResult<Product>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_id: sellerId,
        ...productData,
        status: 'available',
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while creating product',
    };
  }
}

/**
 * Get product by ID
 */
export async function getProduct(productId: string): Promise<ProductServiceResult<Product>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Get all products for a seller
 */
export async function getSellerProducts(
  sellerId: string
): Promise<ProductServiceResult<Product[]>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'seller_id' | 'created_at' | 'updated_at'>>
): Promise<ProductServiceResult<Product>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Delete product
 */
export async function deleteProduct(productId: string): Promise<ProductServiceResult<void>> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Search and filter products
 */
export async function searchProducts(filters: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  status?: 'available' | 'sold' | 'reserved';
  page?: number;
  perPage?: number;
}): Promise<ProductServiceResult<{ products: Product[]; total: number }>> {
  try {
    const supabase = await createServerClient();
    const {
      query,
      category,
      minPrice,
      maxPrice,
      condition,
      status,
      page = 1,
      perPage = 20,
    } = filters;

    let queryBuilder = supabase.from('products').select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    } else {
      queryBuilder = queryBuilder.eq('status', 'available');
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }

    if (condition) {
      queryBuilder = queryBuilder.eq('condition', condition);
    }

    // Pagination
    const offset = (page - 1) * perPage;
    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data: {
        products: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Upload product images to Supabase Storage
 */
export async function uploadProductImages(
  productId: string,
  files: File[]
): Promise<ProductServiceResult<string[]>> {
  try {
    const supabase = await createServerClient();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${productId}-${Date.now()}-${i}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(`images/${fileName}`, file);

      if (uploadError) {
        return {
          success: false,
          error: `Failed to upload image: ${file.name}`,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(`images/${fileName}`);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Save image references to database
    const imageInserts = uploadedUrls.map((url, index) => ({
      product_id: productId,
      image_url: url,
      display_order: index,
    }));

    const { error: dbError } = await supabase
      .from('product_images')
      .insert(imageInserts);

    if (dbError) {
      return {
        success: false,
        error: 'Failed to save image references',
      };
    }

    return {
      success: true,
      data: uploadedUrls,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during upload',
    };
  }
}

/**
 * Get product images
 */
export async function getProductImages(
  productId: string
): Promise<ProductServiceResult<{ id: string; url: string; display_order: number }[]>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('product_images')
      .select('id, image_url as url, display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
