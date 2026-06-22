'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin/logAction';
import { revalidatePath } from 'next/cache';

export async function getPendingEnrollments(institutionId?: string) {
  try {
    const supabase = await createClient();
    
    // Check if logged in and is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Não autenticado.');
    }
    
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile?.role !== 'admin') {
      throw new Error('Acesso negado.');
    }

    let query = supabase
      .from('enrollment_verifications')
      .select(`
        id,
        user_id,
        enrollment_code,
        submitted_at,
        status,
        users:users!inner (
          id,
          full_name,
          enrollment_code,
          institution_id,
          institution:institution (
            id,
            name
          )
        )
      `)
      .eq('status', 'pending');

    if (institutionId && institutionId !== 'all') {
      query = query.eq('users.institution_id', institutionId);
    }

    const { data, error } = await query.order('submitted_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar registos.',
      data: []
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

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituições.',
      data: []
    };
  }
}

export async function processEnrollmentAction(params: {
  id: string;
  status: 'active' | 'suspended';
  rejectionNote?: string;
}) {
  try {
    const { id, status, rejectionNote } = params;
    
    if (status === 'suspended' && (!rejectionNote || !rejectionNote.trim())) {
      return { success: false, error: 'O motivo de rejeição é obrigatório.' };
    }

    const supabase = await createClient();
    const { data: { user: adminUser }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !adminUser) {
      return { success: false, error: 'Não autorizado.' };
    }

    // Double check that the user is an admin
    const { data: adminProfile, error: profileErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (profileErr || adminProfile?.role !== 'admin') {
      return { success: false, error: 'Acesso negado. Apenas administradores.' };
    }

    const adminDb = createAdminClient();

    // Fetch the verification first to see if it exists and find the user_id
    const { data: verification, error: fetchErr } = await adminDb
      .from('enrollment_verifications')
      .select('status, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !verification) {
      return { success: false, error: fetchErr?.message || 'Registo de verificação não encontrado.' };
    }

    if (verification.status !== 'pending') {
      return { success: false, error: 'Este registo já foi processado.' };
    }

    // 1. Update verification
    const { error: verifUpdateErr } = await adminDb
      .from('enrollment_verifications')
      .update({
        status,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        ...(status === 'suspended' ? { rejection_note: rejectionNote?.trim() } : {})
      })
      .eq('id', id);

    if (verifUpdateErr) {
      return { success: false, error: `Erro ao atualizar verificação: ${verifUpdateErr.message}` };
    }

    // 2. Update user
    const { error: userUpdateErr } = await adminDb
      .from('users')
      .update({
        status,
        is_verified: status === 'active' ? true : false
      })
      .eq('id', verification.user_id);

    if (userUpdateErr) {
      // Rollback verification to pending
      await adminDb
        .from('enrollment_verifications')
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          rejection_note: null
        })
        .eq('id', id);

      return { success: false, error: `Erro ao atualizar utilizador: ${userUpdateErr.message}. Operação revertida.` };
    }

    // 3. Log admin action
    try {
      await logAdminAction({
        adminId: adminUser.id,
        action: status === 'active' ? 'approve_enrollment' : 'reject_enrollment',
        targetType: 'enrollment',
        targetId: id,
        reason: status === 'suspended' ? rejectionNote?.trim() : undefined,
        metadata: {
          user_id: verification.user_id,
          rejection_note: status === 'suspended' ? rejectionNote?.trim() : undefined,
        }
      });
    } catch (logErr) {
      console.error('Error logging admin action:', logErr);
    }

    revalidatePath('/admin/registos');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar registo.'
    };
  }
}
