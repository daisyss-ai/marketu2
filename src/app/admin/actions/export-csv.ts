'use server'

import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/logAction'

export type ExportFilters = {
  search?: string
  role?: string
  status?: string
  institutionId?: string
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function exportUsersCSV(filters: ExportFilters) {
  const supabase = await createClient()

  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authUser) throw new Error('Não autenticado.')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Acesso negado. Apenas administradores.')

  let query = supabase
    .from('users')
    .select(`
      id,
      full_name,
      enrollment_code,
      email,
      phone,
      status,
      created_at,
      institution:institution_id (name),
      student:students (
        class:class_id (
          name,
          course:course_id (name),
          academic_year:academic_year_id (label)
        )
      )
    ` as any)

  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,enrollment_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    )
  }
  if (filters.role) query = query.eq('role', filters.role as any)
  if (filters.status) query = query.eq('status', filters.status as any)
  if (filters.institutionId) query = query.eq('institution_id', filters.institutionId)

  const { data: rows, error } = await query.order('full_name', { ascending: true })

  if (error) throw new Error(`Erro ao exportar: ${error.message}`)

  const data = (rows || []) as any[]

  const csvRows = data.map((r: any) => {
    const student = r.student || {}
    const klass = student.class || {}
    return [
      escapeCSV(r.full_name),
      escapeCSV(r.enrollment_code),
      escapeCSV(r.email),
      escapeCSV(r.phone),
      escapeCSV(r.institution?.name),
      escapeCSV(klass.course?.name),
      escapeCSV(klass.name),
      escapeCSV(klass.academic_year?.label),
      escapeCSV(r.status),
      escapeCSV(r.created_at),
    ].join(',')
  })

  const header = [
    'full_name',
    'enrollment_code',
    'email',
    'phone',
    'institution',
    'curso',
    'turma',
    'ano_lectivo',
    'status',
    'created_at',
  ].join(',')

  const csv = [header, ...csvRows].join('\r\n')

  try {
    await logAdminAction({
      adminId: authUser.id,
      action: 'export_csv',
      targetType: 'user',
      targetId: authUser.id,
      metadata: {
        filters,
        recordCount: data.length,
      },
    })
  } catch (logErr) {
    console.error('Erro ao registar log de exportação:', logErr)
  }

  return { csv, count: data.length }
}
