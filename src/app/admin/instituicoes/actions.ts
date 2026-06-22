'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin/logAction';
import { revalidatePath } from 'next/cache';

export type InstitutionRow = {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
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

export async function getInstitutions(includeInactive = false) {
  try {
    await getAdminUser();
    const supabase = await createClient();

    let query = supabase
      .from('institution')
      .select('id, name, logo_url, address, is_active, created_at')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return { success: true, data: data as InstitutionRow[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituições.',
      data: [] as InstitutionRow[],
    };
  }
}

export async function createInstitution(data: {
  name: string;
  logo_url?: string;
  address?: string;
}) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: institution, error } = await adminDb
      .from('institution')
      .insert({
        name: data.name,
        logo_url: data.logo_url || null,
        address: data.address || null,
        is_active: true,
      })
      .select('id, name, logo_url, address')
      .single();

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'create_institution',
        targetType: 'institution',
        targetId: institution.id,
        metadata: {
          name: institution.name,
          address: institution.address,
          logo_url: institution.logo_url,
        },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/instituicoes');
    return { success: true, data: institution };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar instituição.',
    };
  }
}

export async function updateInstitution(
  id: string,
  data: {
    name: string;
    logo_url?: string;
    address?: string;
  }
) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { error } = await adminDb
      .from('institution')
      .update({
        name: data.name,
        logo_url: data.logo_url || null,
        address: data.address || null,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'edit_institution',
        targetType: 'institution',
        targetId: id,
        metadata: {
          name: data.name,
          address: data.address,
          logo_url: data.logo_url,
        },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/instituicoes');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar instituição.',
    };
  }
}

export async function deactivateInstitution(id: string) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('institution')
      .select('is_active, name')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Instituição não encontrada.' };
    }

    if (existing.is_active === false) {
      return { success: false, error: 'Esta instituição já está desativada.' };
    }

    const { error } = await adminDb
      .from('institution')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'edit_institution',
        targetType: 'institution',
        targetId: id,
        reason: 'Instituição desativada',
        metadata: {
          name: existing.name,
          was_active: true,
          is_now_active: false,
        },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/instituicoes');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao desativar instituição.',
    };
  }
}

export async function activateInstitution(id: string) {
  try {
    const { adminId } = await getAdminUser();
    const adminDb = createAdminClient();

    const { data: existing, error: fetchErr } = await adminDb
      .from('institution')
      .select('is_active, name')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Instituição não encontrada.' };
    }

    if (existing.is_active === true) {
      return { success: false, error: 'Esta instituição já está ativa.' };
    }

    const { error } = await adminDb
      .from('institution')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw new Error(error.message);

    try {
      await logAdminAction({
        adminId,
        action: 'edit_institution',
        targetType: 'institution',
        targetId: id,
        reason: 'Instituição reativada',
        metadata: {
          name: existing.name,
          was_active: false,
          is_now_active: true,
        },
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/instituicoes');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao ativar instituição.',
    };
  }
}

export type InstitutionWithCount = InstitutionRow & { student_count: number };

export async function getInstitutionsWithCount(includeInactive = false) {
  try {
    await getAdminUser();
    const supabase = await createClient();

    let query = supabase
      .from('institution')
      .select('id, name, logo_url, address, is_active, created_at')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: institutions, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (institutions || []).map((i) => i.id);
    const countMap: Record<string, number> = {};

    if (ids.length > 0) {
      const { data: counts } = await supabase
        .from('users')
        .select('institution_id')
        .in('institution_id', ids);

      for (const row of counts || []) {
        countMap[row.institution_id] = (countMap[row.institution_id] || 0) + 1;
      }
    }

    const data: InstitutionWithCount[] = (institutions || []).map((inst) => ({
      ...inst,
      student_count: countMap[inst.id] || 0,
    }));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituições.',
      data: [] as InstitutionWithCount[],
    };
  }
}

export async function getInstitutionById(id: string) {
  try {
    await getAdminUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('institution')
      .select('id, name, logo_url, address, is_active, created_at')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return { success: true, data: data as InstitutionRow };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituição.',
      data: null,
    };
  }
}

export async function getInstitutionStats(institutionId: string) {
  try {
    const supabase = await createClient();

    const { count: studentsCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    if (countError) throw new Error(countError.message);

    const { data: institution, error: instError } = await supabase
      .from('institution')
      .select('name')
      .eq('id', institutionId)
      .single();

    if (instError) throw new Error(instError.message);

    return {
      success: true,
      data: {
        institutionName: institution.name,
        studentCount: studentsCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas.',
      data: null,
    };
  }
}

