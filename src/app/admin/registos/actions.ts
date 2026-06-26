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
          users:users!user_id!inner (
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
  const { id, status, rejectionNote } = params;

  if (status === 'suspended' && (!rejectionNote || !rejectionNote.trim())) {
    return { success: false, error: 'O motivo de rejeição é obrigatório.' };
  }

  const supabase = await createClient();
  const { data: { user: adminUser }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !adminUser) {
    return { success: false, error: 'Não autorizado.' };
  }

  const { data: adminProfile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (profileErr || adminProfile?.role !== 'admin') {
    return { success: false, error: 'Acesso negado. Apenas administradores.' };
  }

  const adminDb = createAdminClient();

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

  let verificationUpdated = false;

  try {
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
      throw new Error(`Erro ao atualizar verificação: ${verifUpdateErr.message}`);
    }

    verificationUpdated = true;

    const { error: userUpdateErr } = await adminDb
      .from('users')
      .update({
        status,
        ...(status === 'active' ? { is_verified: true } : {})
      })
      .eq('id', verification.user_id);

    if (userUpdateErr) {
      throw new Error(`Erro ao atualizar utilizador: ${userUpdateErr.message}`);
    }

    // Notificar o estudante sobre o resultado da aprovação.
    // Não lançamos erro em caso de falha — o fluxo principal já concluiu com sucesso.
    const { error: notifErr } = await adminDb.from('notifications').insert({
      user_id: verification.user_id,
      type: status === 'active' ? 'enrollment_approved' : 'enrollment_rejected',
      title: status === 'active' ? 'Conta aprovada' : 'Conta rejeitada',
      body: status === 'active'
        ? 'A tua conta foi aprovada. Já podes usar o MarketU!'
        : `A tua conta foi rejeitada. Motivo: ${rejectionNote?.trim()}`,
      is_read: false,
    });

    if (notifErr) {
      console.error('Erro ao criar notificação de matrícula:', notifErr);
    }

    await logAdminAction({
      adminId: adminUser.id,
      action: status === 'active' ? 'approve_enrollment' : 'reject_enrollment',
      targetType: 'enrollment',
      targetId: id,
      reason: status === 'suspended' ? rejectionNote?.trim() : undefined,
      metadata: {
        user_id: verification.user_id,
        ...(status === 'suspended' ? { rejection_note: rejectionNote?.trim() } : {}),
      }
    });

    revalidatePath('/admin/registos');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    if (verificationUpdated) {
      await adminDb
        .from('enrollment_verifications')
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          rejection_note: null,
        })
        .eq('id', id);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar registo.'
    };
  }
}