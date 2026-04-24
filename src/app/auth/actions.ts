"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = ((formData.get("email") as string | null)?.trim() ?? "").toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";

  if (!email.includes("@")) {
    redirect("/login?error=" + encodeURIComponent("Use o email para entrar."));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) redirect("/login?error=" + encodeURIComponent(error.message));
  redirect("/home?message=" + encodeURIComponent("Login efectuado com sucesso"));
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const studentId = (formData.get("studentId") as string | null)?.trim() ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email = ((formData.get("email") as string | null)?.trim() ?? "").toLowerCase();
  const institutionId = (formData.get("institution") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!studentId || !fullName || !email || !institutionId || !password) {
    redirect("/signup?error=" + encodeURIComponent("Preencha todos os campos obrigatórios."));
  }

  const safeMaybeSingle = async (table: string, column: string, value: string) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    return { data, error };
  };

  const checkDuplicates = async () => {
    // Preferred path (if migration `check_signup_conflicts` is deployed)
    const { data: conflictData, error: conflictError } = await supabase.rpc("check_signup_conflicts", {
      p_email: email,
      p_student_id: studentId,
    });

    if (!conflictError && Array.isArray(conflictData) && conflictData[0]) {
      const { email_exists, student_id_exists } = conflictData[0] as {
        email_exists: boolean;
        student_id_exists: boolean;
      };

      if (email_exists) return { kind: "email" as const };
      if (student_id_exists) return { kind: "studentId" as const };
      return { kind: "none" as const };
    }

    // 1) enrollment_code (unique)
    const { data: existingUser, error: existingUserError } = await safeMaybeSingle(
      "users",
      "enrollment_code",
      studentId,
    );

    if (!existingUserError && existingUser) return { kind: "studentId" as const };

    // 2) Optional: `profiles` table duplicates (common in many Supabase setups)
    //    Handle both `student_id` and `studentId` column naming.
    const profileEmailColumns = ["email", "user_email"] as const;
    for (const column of profileEmailColumns) {
      const { data, error } = await safeMaybeSingle("profiles", column, email);
      if (!error && data) return { kind: "email" as const };
      if (error?.message?.includes("column") && error.message.includes("does not exist")) continue;
      if (error?.message?.includes("relation") && error.message.includes("does not exist")) break;
    }

    const profileStudentColumns = ["student_id", "studentId"] as const;
    for (const column of profileStudentColumns) {
      const { data, error } = await safeMaybeSingle("profiles", column, studentId);
      if (!error && data) return { kind: "studentId" as const };
      if (error?.message?.includes("column") && error.message.includes("does not exist")) continue;
      if (error?.message?.includes("relation") && error.message.includes("does not exist")) break;
    }

    if (existingUserError) return { kind: "lookup_error" as const, message: existingUserError.message };
    return { kind: "none" as const };
  };

  // Pre-check duplicates so we can show a friendly message (instead of a generic 500).
  const preDup = await checkDuplicates();
  if (preDup.kind === "email") {
    redirect("/signup?error=" + encodeURIComponent("Este email já está registado."));
  }
  if (preDup.kind === "studentId") {
    redirect("/signup?error=" + encodeURIComponent("Este ID de estudante já está registado."));
  }
  if (preDup.kind === "lookup_error") {
    console.error("Signup lookup error:", preDup.message);
    redirect("/signup?error=" + encodeURIComponent(preDup.message));
  }

  // Verify institution exists
  const { data: institutionData, error: instError } = await supabase
    .from("institution")
    .select("id")
    .eq("id", institutionId)
    .single();

  if (instError || !institutionData) {
    redirect("/signup?error=" + encodeURIComponent("Instituição não encontrada"));
  }

  const userMetadata = {
    name: fullName,
    fullName,
    full_name: fullName,
    institution: institutionId,
    institutionId,
    institution_id: institutionId,
    studentId,
    // IMPORTANT: your DB trigger `handle_new_user()` reads `raw_user_meta_data->>'student_id'`
    // and inserts into `public.profiles.student_id` (unique). If we don't send it, it becomes '' and collides.
    student_id: studentId,
    enrollment_code: studentId,
    phone,
    role: "student",
  };

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userMetadata },
  });

  if (authError) {
    console.error("Signup auth error:", {
      message: authError.message,
      status: (authError as any).status,
      code: (authError as any).code,
    });

    const status = (authError as any).status as number | undefined;
    const code = (authError as any).code as string | undefined;
    const msg = (authError.message ?? "").toLowerCase();

    if (msg.includes("user already registered")) {
      redirect("/signup?error=" + encodeURIComponent("Este email já está registado."));
    }

    // This is the case you reported ("Database error saving new user"),
    // often caused by DB triggers hitting unique constraints (e.g. profiles_student_id_key).
    if (status === 500 && code === "unexpected_failure") {
      const postDup = await checkDuplicates();
      if (postDup.kind === "email") {
        redirect("/signup?error=" + encodeURIComponent("Este email já está registado."));
      }
      if (postDup.kind === "studentId") {
        redirect("/signup?error=" + encodeURIComponent("Este ID de estudante já está registado."));
      }
    }

    redirect(
      "/signup?error=" +
        encodeURIComponent("Não foi possível criar a conta. Verifique se o email/ID já existem e tente novamente."),
    );
  }

  if (authData.user) {
    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
    } catch {
      // Optional: if you don't provide SUPABASE_SERVICE_ROLE_KEY, we fall back to the session client.
      // This may fail when RLS is enabled.
    }

    const db = admin ?? supabase;

    const { error: userError } = await db.from("users").upsert(
      {
        id: authData.user.id,
        institution_id: institutionId,
        enrollment_code: studentId,
        password_hash: password, // TODO: hash in production
        role: "student",
        full_name: fullName,
        status: "pending",
        is_verified: false,
      },
      { onConflict: "id" },
    );

    if (userError) {
      console.error("Signup users upsert error:", userError);
      redirect("/signup?error=" + encodeURIComponent(userError.message));
    }

    const { error: studentError } = await db.from("students").upsert(
      {
        id: authData.user.id,
        class_id: null,
        enrollment_year: new Date().getFullYear(),
        is_seller: false,
        rating: 0.0,
        total_reviews: 0,
      },
      { onConflict: "id" },
    );

    if (studentError) {
      await db.from("users").delete().eq("id", authData.user.id);
      console.error("Signup students upsert error:", studentError);
      redirect("/signup?error=" + encodeURIComponent(studentError.message));
    }
  }

  if (authData.session) {
    redirect("/home?message=" + encodeURIComponent("Conta criada com sucesso."));
  }

  redirect(
    "/login?message=" +
      encodeURIComponent("Conta criada com sucesso. Verifique o email para confirmar e depois faça login."),
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
