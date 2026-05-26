'use server';

import { createClient } from '@/lib/supabase/server';

type SavedProductRow = {
  id: string;
  seller_id: string;
  is_active: boolean | null;
};

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message || 'Precisas de iniciar sessao.');
  }

  return { supabase, user };
}

export async function saveProductAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) {
      return { success: false, error: 'Produto invalido.' };
    }

    const { supabase, user } = await getAuthenticatedUser();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, is_active')
      .eq('id', normalizedProductId)
      .maybeSingle();

    const typedProduct = product as SavedProductRow | null;

    if (productError || !typedProduct) {
      return { success: false, error: productError?.message || 'Produto nao encontrado.' };
    }

    if (typedProduct.is_active === false) {
      return { success: false, error: 'Este produto ja nao esta disponivel.' };
    }

    if (typedProduct.seller_id === user.id) {
      return { success: false, error: 'Nao podes guardar o teu proprio produto.' };
    }

    const { error: saveError } = await supabase.from('saved_products').insert({
      user_id: user.id,
      product_id: normalizedProductId,
    });

    if (saveError && saveError.code !== '23505') {
      return { success: false, error: saveError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao guardar produto.',
    };
  }
}

export async function unsaveProductAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) {
      return { success: false, error: 'Produto invalido.' };
    }

    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from('saved_products')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', normalizedProductId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao remover produto guardado.',
    };
  }
}
