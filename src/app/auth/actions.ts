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

  // Many Supabase projects have a DB trigger on `auth.users` that writes into `public.users`.
  // That trigger usually reads from `raw_user_meta_data`, so we send redundant keys to match common conventions.
  const userMetadata = {
    name: fullName,
    fullName: fullName,
    full_name: fullName,
    institution: institutionId,
    institutionId: institutionId,
    institution_id: institutionId,
    studentId: studentId,
    enrollment_code: studentId,
    phone: phone,
    role: 'student',
  }

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
      data: userMetadata,
    }
  })

  if (authError) {
    console.error("Signup auth error:", {
      message: authError.message,
      status: (authError as any).status,
      code: (authError as any).code,
    })
    redirect("/signup?error=" + authError.message)
  }

  if (authData.user) {
    // Insert into users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({
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
      }, { onConflict: 'id' })

    if (userError) {
      // If user insert fails, delete auth user
      console.error("Signup users upsert error:", userError)
      redirect("/signup?error=" + encodeURIComponent(userError.message))
    }

    // Insert into students table
    const { error: studentError } = await supabase
      .from('students')
      .upsert({
        id: authData.user.id,
        class_id: null, // Will be set later
        enrollment_year: new Date().getFullYear(),
        is_seller: false,
        rating: 0.00,
        total_reviews: 0,
      }, { onConflict: 'id' })

    if (studentError) {
      // Cleanup if student insert fails
      await supabase.from('users').delete().eq('id', authData.user.id)
      console.error("Signup students upsert error:", studentError)
      redirect("/signup?error=" + encodeURIComponent(studentError.message))
    }
  }

  redirect("/login?message=Conta criada com sucesso. Faça login.")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
