'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/logAction'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/supabase'

type UserRow = Database['public']['Tables']['users']['Row']
type StudentRow = Database['public']['Tables']['students']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']
type OrderRow = Database['public']['Tables']['orders']['Row']

export type UserFullData = {
  user: UserRow & { institution: { id: string; name: string } | null }
  student: (StudentRow & {
    class: {
      id: string
      name: string
      grade: number | null
      academic_year: { id: string; label: string } | null
    } | null
  }) | null
  products: (ProductRow & { category: { name: string } | null })[]
  ordersAsBuyer: (OrderRow & {
    buyer: { full_name: string } | null
  })[]
  ordersAsSeller: OrderRow[]
}

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Não autenticado.')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Acesso negado. Apenas administradores.')
  return { adminId: user.id }
}

export async function getUserData(id: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { data: user, error: userErr } = await adminDb
      .from('users')
      .select('*, institution:institution_id(id, name)')
      .eq('id', id)
      .single()

    if (userErr || !user) return { success: false as const, error: 'Utilizador não encontrado.' }

    const { data: student } = await adminDb
      .from('students')
      .select('*, class:class_id(id, name, grade, academic_year:academic_year_id(id, label))')
      .eq('id', id)
      .maybeSingle()

    const { data: products } = await adminDb
      .from('products')
      .select('*, category:category_id(name)')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })

    const { data: ordersAsBuyer } = await adminDb
      .from('orders')
      .select('*, buyer:buyer_id(full_name)')
      .eq('buyer_id', id)
      .order('created_at', { ascending: false })

    const { data: ordersAsSeller } = await adminDb
      .from('orders')
      .select('*')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })

    return {
      success: true as const,
      data: {
        user,
        student: student ?? null,
        products: products ?? [],
        ordersAsBuyer: ordersAsBuyer ?? [],
        ordersAsSeller: ordersAsSeller ?? [],
      } as UserFullData,
    }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar dados.',
    }
  }
}

export async function getInstitutions() {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { data, error } = await adminDb
      .from('institution')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return { success: true as const, data: data || [] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar instituições.',
    }
  }
}

export async function getClassesByInstitution(institutionId: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { data, error } = await adminDb
      .from('classes')
      .select('id, name, grade, academic_year:academic_year_id(id, label)')
      .eq('academic_years.institution_id', institutionId)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return { success: true as const, data: data || [] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar turmas.',
    }
  }
}

export async function toggleAdminRole(userId: string) {
  try {
    const { adminId } = await getAdminUser()
    if (userId === adminId) {
      return { success: false as const, error: 'Não pode remover o seu próprio cargo de administrador.' }
    }

    const adminDb = createAdminClient()

    const { data: target } = await adminDb
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (!target) return { success: false as const, error: 'Utilizador não encontrado.' }

    const newRole = target.role === 'admin' ? 'student' : 'admin'

    const { error: updateErr } = await adminDb
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateErr) return { success: false as const, error: `Erro ao atualizar cargo: ${updateErr.message}` }

    await logAdminAction({
      adminId,
      action: newRole === 'admin' ? 'promote_admin' : 'demote_admin',
      targetType: 'user',
      targetId: userId,
      metadata: { previous_role: target.role, new_role: newRole },
    })

    revalidatePath(`/admin/utilizadores/${userId}`)
    revalidatePath('/admin/utilizadores')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao alterar cargo.',
    }
  }
}

export async function toggleSellerVerification(userId: string) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { data: student } = await adminDb
      .from('students')
      .select('is_verified_seller')
      .eq('id', userId)
      .maybeSingle()

    const newValue = !student?.is_verified_seller

    const { error: upsertErr } = await adminDb
      .from('students')
      .upsert({
        id: userId,
        is_verified_seller: newValue,
      }, { onConflict: 'id' })

    if (upsertErr) return { success: false as const, error: `Erro ao verificar vendedor: ${upsertErr.message}` }

    await logAdminAction({
      adminId,
      action: 'verify_seller',
      targetType: 'student',
      targetId: userId,
      metadata: { is_verified_seller: newValue },
    })

    revalidatePath(`/admin/utilizadores/${userId}`)
    return { success: true as const, data: { is_verified_seller: newValue } }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao verificar vendedor.',
    }
  }
}

export async function banUser(userId: string, reason: string) {
  try {
    const { adminId } = await getAdminUser()
    if (!reason.trim()) return { success: false as const, error: 'O motivo do ban é obrigatório.' }

    if (userId === adminId) {
      return { success: false as const, error: 'Não pode banir a si próprio.' }
    }

    const adminDb = createAdminClient()

    const { error: updateErr } = await adminDb
      .from('users')
      .update({ status: 'suspended', ban_reason: reason.trim() })
      .eq('id', userId)

    if (updateErr) return { success: false as const, error: `Erro ao banir: ${updateErr.message}` }

    try {
      await adminDb.auth.admin.signOut(userId)
    } catch {
      // session may not exist; non-critical
    }

    await logAdminAction({
      adminId,
      action: 'ban_user',
      targetType: 'user',
      targetId: userId,
      reason: reason.trim(),
    })

    revalidatePath(`/admin/utilizadores/${userId}`)
    revalidatePath('/admin/utilizadores')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao banir utilizador.',
    }
  }
}

export async function unbanUser(userId: string) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { error: updateErr } = await adminDb
      .from('users')
      .update({ status: 'active', ban_reason: null })
      .eq('id', userId)

    if (updateErr) return { success: false as const, error: `Erro ao remover ban: ${updateErr.message}` }

    await logAdminAction({
      adminId,
      action: 'unban_user',
      targetType: 'user',
      targetId: userId,
    })

    revalidatePath(`/admin/utilizadores/${userId}`)
    revalidatePath('/admin/utilizadores')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao remover ban.',
    }
  }
}

export async function updateAcademicData(userId: string, institutionId: string, classId?: string | null) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { error: userErr } = await adminDb
      .from('users')
      .update({ institution_id: institutionId })
      .eq('id', userId)
    if (userErr) return { success: false as const, error: `Erro ao atualizar instituição: ${userErr.message}` }

    const { error: studentErr } = await adminDb
      .from('students')
      .upsert({
        id: userId,
        class_id: classId ?? null,
      }, { onConflict: 'id' })
    if (studentErr) return { success: false as const, error: `Erro ao atualizar turma: ${studentErr.message}` }

    await logAdminAction({
      adminId,
      action: 'edit_student_data',
      targetType: 'student',
      targetId: userId,
      metadata: { institution_id: institutionId, class_id: classId },
    })

    revalidatePath(`/admin/utilizadores/${userId}`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao atualizar dados académicos.',
    }
  }
}

export async function updateAdminNotes(userId: string, notes: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('users')
      .update({ admin_notes: notes.trim() || null })
      .eq('id', userId)
    if (error) return { success: false as const, error: `Erro ao guardar notas: ${error.message}` }

    revalidatePath(`/admin/utilizadores/${userId}`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao guardar notas.',
    }
  }
}
