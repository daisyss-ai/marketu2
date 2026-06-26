'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin/logAction';
import { revalidatePath } from 'next/cache';

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean | null;
  created_at: string | null;
  children?: CategoryRow[];
};

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

function buildTree(categories: CategoryRow[]): CategoryRow[] {
  const map = new Map<string, CategoryRow>();
  const roots: CategoryRow[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of map.values()) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  }

  return roots;
}

function flattenTree(tree: CategoryRow[], depth = 0): (CategoryRow & { depth: number })[] {
  const result: (CategoryRow & { depth: number })[] = [];
  for (const node of tree) {
    result.push({ ...node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export async function getCategoriesTree(includeInactive = false) {
  try {
    await getAdminUser();
    const supabase = await createClient();

    let query = supabase
      .from('categories')
      .select('id, parent_id, name, slug, icon, is_active, created_at')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const tree = buildTree(data as CategoryRow[]);
    const flat = flattenTree(tree);

    return { success: true, data: flat, tree };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar categorias.',
      data: [],
      tree: [] as CategoryRow[],
    };
  }
}

export async function createCategory(data: {
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string | null;
}) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: category, error } = await adminDb
      .from('categories')
      .insert({
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        parent_id: data.parent_id || null,
        is_active: true,
      })
      .select('id, name, slug')
      .single();

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'create_category',
        targetType: 'category',
        targetId: category.id,
        metadata: { name: category.name, slug: category.slug },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/categorias');
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar categoria.',
    };
  }
}

export async function updateCategory(
  id: string,
  data: { name: string; slug: string; icon?: string; parent_id?: string | null }
) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { error } = await adminDb
      .from('categories')
      .update({
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        parent_id: data.parent_id || null,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'edit_category',
        targetType: 'category',
        targetId: id,
        metadata: { name: data.name, slug: data.slug },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar categoria.',
    };
  }
}

export async function archiveCategory(id: string) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('categories')
      .select('is_active, name')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Categoria não encontrada.' };
    }

    if (existing.is_active === false) {
      return { success: false, error: 'Esta categoria já está arquivada.' };
    }

    const { error: updateErr } = await adminDb
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (updateErr) throw new Error(updateErr.message);

    try {
      await logAdminAction({
        adminId,
        action: 'archive_category',
        targetType: 'category',
        targetId: id,
        metadata: { name: existing.name },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao arquivar categoria.',
    };
  }
}
