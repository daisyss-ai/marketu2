"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Get enrollment code from form (assuming it's passed as email for now)
  const enrollmentCode = formData.get("email") as string
  const password = formData.get("password") as string

  // First, find user by enrollment_code
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, enrollment_code, password_hash')
    .eq('enrollment_code', enrollmentCode)
    .single()

  if (userError || !userData) {
    redirect("/login?error=Credenciais inválidas")
  }

  // For now, we'll use Supabase auth with email. In production, you'd verify password_hash
  // But since we're using Supabase auth, let's assume enrollment_code is used as email for auth
  const { error } = await supabase.auth.signInWithPassword({
    email: enrollmentCode, // Assuming enrollment_code is used as email in auth
    password: password,
  })

  if (error) redirect("/login?error=" + error.message)
  redirect("/home?message=Login efectuado com sucesso")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const studentId = formData.get("studentId") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const institutionId = formData.get("institution") as string
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string

  // Verify institution exists
  const { data: institutionData, error: instError } = await supabase
    .from('institution')
    .select('id')
    .eq('id', institutionId)
    .single()

  if (instError || !institutionData) {
    redirect("/signup?error=Instituição não encontrada")
  }

  // Create user in auth (using email as auth identifier)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: fullName,
        institution: institutionId,
      }
    }
  })

  if (authError) {
    redirect("/signup?error=" + authError.message)
  }

  if (authData.user) {
    // Insert into users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        institution_id: institutionId,
        enrollment_code: studentId,
        password_hash: password, // In production, hash this
        role: 'student',
        full_name: fullName,
        email: email,
        phone: phone,
        status: 'pending',
        is_verified: false,
      })

    if (userError) {
      // If user insert fails, delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      redirect("/signup?error=Erro ao criar usuário")
    }

    // Insert into students table
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        class_id: null, // Will be set later
        enrollment_year: new Date().getFullYear(),
        is_seller: false,
        rating: 0.00,
        total_reviews: 0,
      })

    if (studentError) {
      // Cleanup if student insert fails
      await supabase.from('users').delete().eq('id', authData.user.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      redirect("/signup?error=Erro ao criar estudante")
    }
  }

  redirect("/login?message=Conta criada com sucesso. Faça login.")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
