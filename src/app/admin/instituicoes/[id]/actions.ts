'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/logAction'
import { revalidatePath } from 'next/cache'

export type CourseRow = {
  id: string
  institution_id: string
  name: string
  description: string | null
  duration_years: number | null
  is_active: boolean | null
  created_at: string | null
}

export type ClassRow = {
  id: string
  academic_year_id: string
  course_id: string | null
  name: string
  grade: number | null
  created_at: string | null
  student_count: number
  academic_year: { id: string; label: string } | null
  course: { id: string; name: string } | null
}

export type ClassOption = { id: string; name: string; grade: number | null }

export type AcademicYearRow = {
  id: string
  institution_id: string
  label: string
  is_active: boolean | null
  starts_at: string | null
  ends_at: string | null
  created_at: string | null
}

export type InstitutionUserRow = {
  id: string
  full_name: string
  username: string | null
  enrollment_code: string
  email: string | null
  role: string
  status: string | null
  is_verified: boolean | null
  created_at: string | null
  student: {
    is_seller: boolean | null
    is_verified_seller: boolean | null
    class: { id: string; name: string; grade: number | null } | null
  } | null
}

export type InstitutionStats = {
  studentCount: number
  productCount: number
  verifiedSellerCount: number
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

// ─── Stats ──────────────────────────────────────────────────────────

export async function getInstitutionStats(institutionId: string) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    const { count: studentCount, error: countErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('role', 'student')

    if (countErr) throw new Error(countErr.message)

    const { data: userIds } = await supabase
      .from('users')
      .select('id')
      .eq('institution_id', institutionId)

    const ids = (userIds || []).map(u => u.id)
    let productCount = 0
    let verifiedSellerCount = 0

    if (ids.length > 0) {
      const { count: pCount, error: prodErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .in('seller_id', ids)

      if (!prodErr) productCount = pCount || 0

      const { count: vCount, error: verErr } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('id', ids)
        .eq('is_verified_seller', true)

      if (!verErr) verifiedSellerCount = vCount || 0
    }

    return {
      success: true as const,
      data: { studentCount: studentCount || 0, productCount, verifiedSellerCount } as InstitutionStats,
    }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas.',
      data: null,
    }
  }
}

// ─── Courses ────────────────────────────────────────────────────────

export async function getCourses(institutionId: string) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('courses' as any)
      .select('*')
      .eq('institution_id', institutionId)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true as const, data: (data || []) as CourseRow[] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar cursos.',
      data: [] as CourseRow[],
    }
  }
}

export async function createCourse(data: {
  institution_id: string
  name: string
  description?: string
  duration_years?: number
}) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { data: course, error } = await adminDb
      .from('courses' as any)
      .insert({
        institution_id: data.institution_id,
        name: data.name,
        description: data.description || null,
        duration_years: data.duration_years || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    const c = course as any

    try {
      await logAdminAction({
        adminId,
        action: 'create_course',
        targetType: 'course',
        targetId: c.id,
        metadata: { institution_id: data.institution_id, name: c.name },
      })
    } catch (logErr) {
      console.error('Error logging admin action:', logErr)
    }

    revalidatePath(`/admin/instituicoes/${data.institution_id}/cursos`)
    return { success: true as const, data: c as CourseRow }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao criar curso.',
    }
  }
}

export async function updateCourse(id: string, data: {
  name: string
  description?: string
  duration_years?: number
}) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('courses' as any)
      .update({
        name: data.name,
        description: data.description || null,
        duration_years: data.duration_years || null,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao atualizar curso.',
    }
  }
}

export async function archiveCourse(id: string, institutionId: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('courses' as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/instituicoes/${institutionId}/cursos`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao arquivar curso.',
    }
  }
}

// ─── Classes ────────────────────────────────────────────────────────

export async function getClassesByInstitution(institutionId: string) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    const { data: academicYears } = await supabase
      .from('academic_years')
      .select('id')
      .eq('institution_id', institutionId)

    if (!academicYears || academicYears.length === 0) {
      return { success: true as const, data: [] as ClassRow[] }
    }

    const ayIds = academicYears.map(ay => ay.id)

    const { data, error } = await supabase
      .from('classes')
      .select('*, academic_year:academic_year_id(id, label), course:course_id(id, name)')
      .in('academic_year_id', ayIds)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    const classList = (data || []) as unknown as (Omit<ClassRow, 'student_count'>)[]
    const classIds = classList.map((c) => c.id)

    const countMap: Record<string, number> = {}
    if (classIds.length > 0) {
      const { data: studentCounts } = await supabase
        .from('students')
        .select('class_id')
        .in('class_id', classIds)

      for (const row of studentCounts || []) {
        countMap[row.class_id] = (countMap[row.class_id] || 0) + 1
      }
    }

    const dataWithCount: ClassRow[] = classList.map((c) => ({
      ...c,
      student_count: countMap[c.id] || 0,
    }))

    return { success: true as const, data: dataWithCount }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar turmas.',
      data: [] as ClassRow[],
    }
  }
}

export async function createClass(data: {
  institution_id: string
  academic_year_id: string
  course_id?: string
  name: string
  grade: number
}) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { data: cls, error } = await adminDb
      .from('classes')
      .insert({
        academic_year_id: data.academic_year_id,
        course_id: data.course_id || null,
        name: data.name,
        grade: data.grade,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    try {
      await logAdminAction({
        adminId,
        action: 'create_class',
        targetType: 'class',
        targetId: cls.id,
        metadata: { institution_id: data.institution_id, name: cls.name, grade: cls.grade },
      })
    } catch (logErr) {
      console.error('Error logging admin action:', logErr)
    }

    revalidatePath(`/admin/instituicoes/${data.institution_id}/turmas`)
    return { success: true as const, data: cls }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao criar turma.',
    }
  }
}

export async function updateClass(id: string, data: {
  academic_year_id: string
  course_id?: string
  name: string
  grade: number
}) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('classes')
      .update({
        academic_year_id: data.academic_year_id,
        course_id: data.course_id || null,
        name: data.name,
        grade: data.grade,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao atualizar turma.',
    }
  }
}

export async function deleteClass(id: string, institutionId: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/instituicoes/${institutionId}/turmas`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao eliminar turma.',
    }
  }
}

// ─── Academic Years ─────────────────────────────────────────────────

export async function getAcademicYears(institutionId: string) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return { success: true as const, data: (data || []) as AcademicYearRow[] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar anos lectivos.',
      data: [] as AcademicYearRow[],
    }
  }
}

export async function createAcademicYear(data: {
  institution_id: string
  label: string
  starts_at?: string
  ends_at?: string
}) {
  try {
    const { adminId } = await getAdminUser()
    const adminDb = createAdminClient()

    const { data: ay, error } = await adminDb
      .from('academic_years')
      .insert({
        institution_id: data.institution_id,
        label: data.label,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    try {
      await logAdminAction({
        adminId,
        action: 'create_academic_year',
        targetType: 'academic_year',
        targetId: ay.id,
        metadata: { institution_id: data.institution_id, label: ay.label },
      })
    } catch (logErr) {
      console.error('Error logging admin action:', logErr)
    }

    revalidatePath(`/admin/instituicoes/${data.institution_id}/anos-lectivos`)
    return { success: true as const, data: ay as AcademicYearRow }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao criar ano lectivo.',
    }
  }
}

export async function updateAcademicYear(id: string, data: {
  label: string
  starts_at?: string
  ends_at?: string
}) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('academic_years')
      .update({
        label: data.label,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao atualizar ano lectivo.',
    }
  }
}

export async function setActiveAcademicYear(id: string, institutionId: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('academic_years')
      .update({ is_active: true })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/instituicoes/${institutionId}/anos-lectivos`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao definir ano lectivo ativo.',
    }
  }
}

export async function deleteAcademicYear(id: string, institutionId: string) {
  try {
    await getAdminUser()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('academic_years')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/instituicoes/${institutionId}/anos-lectivos`)
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao eliminar ano lectivo.',
    }
  }
}

// ─── Classes for filters ─────────────────────────────────────────────

export async function getInstitutionClasses(institutionId: string) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    const { data: academicYears } = await supabase
      .from('academic_years')
      .select('id')
      .eq('institution_id', institutionId)

    if (!academicYears || academicYears.length === 0) {
      return { success: true as const, data: [] as ClassOption[] }
    }

    const ayIds = academicYears.map(ay => ay.id)

    const { data, error } = await supabase
      .from('classes')
      .select('id, name, grade')
      .in('academic_year_id', ayIds)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true as const, data: (data || []) as ClassOption[] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar turmas.',
      data: [] as ClassOption[],
    }
  }
}

// ─── Alunos ─────────────────────────────────────────────────────────

export async function getInstitutionUsers(
  institutionId: string,
  filters?: { class_id?: string; status?: string }
) {
  try {
    await getAdminUser()
    const supabase = await createClient()

    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        username,
        enrollment_code,
        email,
        role,
        status,
        is_verified,
        created_at,
        student:students (
          is_seller,
          is_verified_seller,
          class:class_id (id, name, grade)
        )
      `)
      .eq('institution_id', institutionId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.class_id) {
      const { data: studentIds } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', filters.class_id)

      const ids = (studentIds || []).map((s) => s.id)
      if (ids.length === 0) {
        return { success: true as const, data: [] as InstitutionUserRow[] }
      }
      query = query.in('id', ids)
    }

    query = query.order('full_name', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return { success: true as const, data: (data || []) as unknown as InstitutionUserRow[] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao carregar alunos.',
      data: [] as InstitutionUserRow[],
    }
  }
}
