'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin/logAction';
import { revalidatePath } from 'next/cache';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type ProductModerationRow = {
  id: string;
  product_id: string;
  status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
  created_at: string | null;
  products: {
    id: string;
    seller_id: string;
    category_id: string | null;
    type: string;
    title: string;
    description: string | null;
    price: number | null;
    is_free: boolean | null;
    is_active: boolean | null;
    is_approved: boolean | null;
    rating: number | null;
    total_reviews: number | null;
    total_sales: number | null;
    created_at: string | null;
    categories: { id: string; name: string } | null;
    product_media: { url: string; position: number | null; is_preview: boolean | null }[];
    seller: {
      id: string;
      full_name: string;
    } | null;
  } | null;
};

export type Category = { id: string; name: string };
export type Institution = { id: string; name: string };

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Não autenticado.');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Acesso negado. Apenas administradores.');
  return { adminId: user.id };
}

export async function getProductsByModeration(
  status: ModerationStatus,
  filters?: { categoryId?: string; institutionId?: string; dateFrom?: string; dateTo?: string }
) {
  try {
    await getAdminUser();
    const supabase = await createClient();

    const { data: raw, error } = await supabase
      .from('content_moderation')
      .select(`
        id,
        product_id,
        status,
        reviewed_by,
        reviewed_at,
        rejection_note,
        created_at,
        products:product_id (
          id,
          seller_id,
          category_id,
          type,
          title,
          description,
          price,
          is_free,
          is_active,
          is_approved,
          rating,
          total_reviews,
          total_sales,
          created_at,
          categories:category_id (id, name),
          product_media (
            url,
            position,
            is_preview
          )
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const productMap = new Map<string, ProductModerationRow>();
    for (const item of (raw || []) as unknown as ProductModerationRow[]) {
      const pid = item.product_id;
      if (!productMap.has(pid) || new Date(item.created_at || '') > new Date(productMap.get(pid)!.created_at || '')) {
        productMap.set(pid, item);
      }
    }

    let results = Array.from(productMap.values());

    const sellerIds = [...new Set(results.map(r => r.products?.seller_id).filter((id): id is string => !!id))];

    const sellerNameMap = new Map<string, string>();
    const sellerInstMap = new Map<string, string | null>();

    if (sellerIds.length > 0) {
      const { data: sellers, error: sellerError } = await supabase
        .from('users')
        .select('id, full_name, institution_id')
        .in('id', sellerIds);

      if (sellerError) throw new Error(sellerError.message);

      for (const s of sellers || []) {
        sellerNameMap.set(s.id, s.full_name);
        sellerInstMap.set(s.id, s.institution_id);
      }
    }

    for (const item of results) {
      const sid = item.products?.seller_id;
      if (sid && sellerNameMap.has(sid)) {
        (item.products as any).seller = { id: sid, full_name: sellerNameMap.get(sid) };
      }
    }

    if (filters?.categoryId) {
      results = results.filter(r => r.products?.category_id === filters.categoryId);
    }
    if (filters?.institutionId) {
      results = results.filter(r => {
        const sid = r.products?.seller_id;
        return sid ? sellerInstMap.get(sid) === filters.institutionId : false;
      });
    }
    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom);
      results = results.filter(r => r.products?.created_at && new Date(r.products.created_at) >= from);
    }
    if (filters?.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      results = results.filter(r => r.products?.created_at && new Date(r.products.created_at) <= to);
    }

    results.sort((a, b) => {
      const da = a.products?.created_at || a.created_at || '';
      const db = b.products?.created_at || b.created_at || '';
      return db.localeCompare(da);
    });

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar produtos.',
      data: [] as ProductModerationRow[],
    };
  }
}

export async function getCategories() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar categorias.',
      data: [],
    };
  }
}

export async function getInstitutions() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('institution')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituições.',
      data: [],
    };
  }
}

export async function approveProduct(moderationId: string, productId: string) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('content_moderation')
      .select('status')
      .eq('id', moderationId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message || 'Registo de moderação não encontrado.' };
    }

    if (existing.status !== 'pending') {
      return { success: false, error: 'Este produto já foi processado.' };
    }

    const { error: updateErr } = await adminDb
      .from('content_moderation')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', moderationId);

    if (updateErr) {
      return { success: false, error: `Erro ao aprovar produto: ${updateErr.message}` };
    }

    try {
      await logAdminAction({
        adminId,
        action: 'approve_product',
        targetType: 'product',
        targetId: productId,
        metadata: { moderation_id: moderationId },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/produtos');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao aprovar produto.',
    };
  }
}

export async function rejectProduct(moderationId: string, productId: string, rejectionNote: string) {
  try {
    if (!rejectionNote.trim()) {
      return { success: false, error: 'O motivo de rejeição é obrigatório.' };
    }

    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('content_moderation')
      .select('status')
      .eq('id', moderationId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message || 'Registo de moderação não encontrado.' };
    }

    if (existing.status !== 'pending') {
      return { success: false, error: 'Este produto já foi processado.' };
    }

    const { error: updateErr } = await adminDb
      .from('content_moderation')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_note: rejectionNote.trim(),
      })
      .eq('id', moderationId);

    if (updateErr) {
      return { success: false, error: `Erro ao rejeitar produto: ${updateErr.message}` };
    }

    const { data: productData } = await adminDb
      .from('products')
      .select('seller_id, title')
      .eq('id', productId)
      .single();

    if (productData?.seller_id) {
      const { error: notifErr } = await adminDb.from('notifications').insert({
        user_id: productData.seller_id,
        type: 'product_rejected',
        title: 'Produto rejeitado',
        body: `O seu produto "${productData.title || 'sem título'}" foi rejeitado.\nMotivo: ${rejectionNote.trim()}`,
      });

      if (notifErr) {
        console.error('Error creating notification:', notifErr);
      }
    }

    try {
      await logAdminAction({
        adminId,
        action: 'reject_product',
        targetType: 'product',
        targetId: productId,
        reason: rejectionNote.trim(),
        metadata: { moderation_id: moderationId },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/produtos');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao rejeitar produto.',
    };
  }
}

export async function removeProduct(productId: string) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('products')
      .select('is_active')
      .eq('id', productId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: fetchErr?.message || 'Produto não encontrado.' };
    }

    if (existing.is_active === false) {
      return { success: false, error: 'Este produto já foi removido da plataforma.' };
    }

    const { error: updateErr } = await adminDb
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (updateErr) {
      return { success: false, error: `Erro ao remover produto: ${updateErr.message}` };
    }

    try {
      await logAdminAction({
        adminId,
        action: 'remove_product',
        targetType: 'product',
        targetId: productId,
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/produtos');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao remover produto.',
    };
  }
}
