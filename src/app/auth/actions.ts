"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function sanitizeRedirectTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const redirectTo = value.trim();
  if (!redirectTo.startsWith("/")) return null;
  if (redirectTo.startsWith("//")) return null;
  if (redirectTo.includes("://")) return null;
  return redirectTo;
}

function buildSignupErrorRedirect(message: string, redirectTo: string | null): string {
  return (
    "/signup?error=" +
    encodeURIComponent(message) +
    (redirectTo ? "&redirectTo=" + encodeURIComponent(redirectTo) : "")
  );
}

type DuplicateCheckResult =
  | { kind: "email" }
  | { kind: "studentId" }
  | { kind: "none" }
  | { kind: "lookup_error"; message: string };

async function checkDuplicates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  studentId: string,
): Promise<DuplicateCheckResult> {
  const safeMaybeSingle = async (table: string, column: string, value: string) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    return { data, error };
  };

  // Preferred path (if migration `check_signup_conflicts` is deployed)
  const { data: conflictData, error: conflictError } = await supabase.rpc("check_signup_conflicts", {
    p_email: email,
    p_student_id: studentId,
  });

  if (!conflictError && conflictData) {
    const row = Array.isArray(conflictData) ? conflictData[0] : conflictData;
    if (row && typeof row === "object" && ("email_exists" in row || "student_id_exists" in row)) {
      const { email_exists, student_id_exists } = row as {
        email_exists?: boolean;
        student_id_exists?: boolean;
      };

      if (email_exists) return { kind: "email" };
      if (student_id_exists) return { kind: "studentId" };
      return { kind: "none" };
    }
  }

  // 1) enrollment_code (unique)
  const { data: existingUser, error: existingUserError } = await safeMaybeSingle(
    "users",
    "enrollment_code",
    studentId,
  );

  if (!existingUserError && existingUser) return { kind: "studentId" };

  // 2) Optional: `profiles` table duplicates (common in many Supabase setups)
  const profileEmailColumns = ["email", "user_email"] as const;
  for (const column of profileEmailColumns) {
    const { data, error } = await safeMaybeSingle("profiles", column, email);
    if (!error && data) return { kind: "email" };
    if (error?.message?.includes("column") && error.message.includes("does not exist")) continue;
    if (error?.message?.includes("relation") && error.message.includes("does not exist")) break;
  }

  const profileStudentColumns = ["student_id", "studentId"] as const;
  for (const column of profileStudentColumns) {
    const { data, error } = await safeMaybeSingle("profiles", column, studentId);
    if (!error && data) return { kind: "studentId" };
    if (error?.message?.includes("column") && error.message.includes("does not exist")) continue;
    if (error?.message?.includes("relation") && error.message.includes("does not exist")) break;
  }

  if (existingUserError) return { kind: "lookup_error", message: existingUserError.message };
  return { kind: "none" };
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = ((formData.get("email") as string | null)?.trim() ?? "").toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!email.includes("@")) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Use o email para entrar.") +
        (redirectTo ? "&redirectTo=" + encodeURIComponent(redirectTo) : ""),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      "/login?error=" +
        encodeURIComponent(error.message) +
        (redirectTo ? "&redirectTo=" + encodeURIComponent(redirectTo) : ""),
    );
  }

  if (redirectTo && redirectTo !== "/login" && redirectTo !== "/signup") {
    redirect(redirectTo);
  }

  redirect("/home?message=" + encodeURIComponent("Login efectuado com sucesso"));
}

interface VerificationPayload {
  studentId: string;
  fullName: string;
  email: string;
  institutionId: string;
}

export async function sendVerificationCode(
  payload: VerificationPayload,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const studentId = payload.studentId.trim();
  const fullName = payload.fullName.trim();
  const email = payload.email.trim().toLowerCase();
  const institutionId = payload.institutionId.trim();

  if (!studentId || !fullName || !email || !institutionId) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  const dup = await checkDuplicates(supabase, email, studentId);
  if (dup.kind === "email") return { success: false, error: "Este email já está registado." };
  if (dup.kind === "studentId") return { success: false, error: "Este ID de estudante já está registado." };
  if (dup.kind === "lookup_error") {
    console.error("Signup lookup error:", dup.message);
    return { success: false, error: dup.message };
  }

  const { data: institutionData, error: instError } = await supabase
    .from("institution")
    .select("id")
    .eq("id", institutionId)
    .single();

  if (instError || !institutionData) {
    return { success: false, error: "Instituição não encontrada." };
  }

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        name: fullName,
        fullName,
        full_name: fullName,
        institution: institutionId,
        institutionId,
        institution_id: institutionId,
        studentId,
        student_id: studentId,
        enrollment_code: studentId,
        role: "student",
      },
    },
  });

  if (otpError) {
    console.error("sendVerificationCode error:", otpError);
    return { success: false, error: "Não foi possível enviar o código. Tenta novamente." };
  }

  return { success: true };
}

export async function verifyVerificationCode(payload: {
  email: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const email = payload.email.trim().toLowerCase();
  const token = payload.token.trim();

  if (!/^\d{6}$/.test(token)) {
    return { success: false, error: "Código inválido. Introduz os 6 dígitos." };
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { success: false, error: "Código incorreto ou expirado. Tenta novamente." };
  }

  return { success: true };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const studentId = (formData.get("studentId") as string | null)?.trim() ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const institutionId = (formData.get("institution") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = sanitizeRedirectTo(formData.get("redirectTo"));

  if (!studentId || !fullName || !institutionId || !password) {
    redirect(buildSignupErrorRedirect("Preencha todos os campos obrigatórios.", redirectTo));
  }

  const { data: userData, error: userFetchError } = await supabase.auth.getUser();

  if (userFetchError || !userData.user) {
    redirect(
      buildSignupErrorRedirect(
        "A tua verificação expirou. Confirma o teu e-mail novamente para continuar.",
        redirectTo,
      ),
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
    data: { phone },
  });

  if (updateError) {
    console.error("Signup updateUser error:", updateError);
    redirect(buildSignupErrorRedirect("Não foi possível definir a senha. Tenta novamente.", redirectTo));
  }

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    // Optional: if you don't provide SUPABASE_SERVICE_ROLE_KEY, we fall back to the session client.
    // This may fail when RLS is enabled.
  }

  const db = admin ?? supabase;
  const userId = userData.user.id;

  const { error: userError } = await db.from("users").upsert(
    {
      id: userId,
      institution_id: institutionId,
      enrollment_code: studentId,
      role: "student",
      full_name: fullName,
      status: "pending",
      is_verified: true,
    },
    { onConflict: "id" },
  );

  if (userError) {
    console.error("Signup users upsert error:", userError);
    redirect(buildSignupErrorRedirect(userError.message, redirectTo));
  }

  const { error: studentError } = await db.from("students").upsert(
    {
      id: userId,
      class_id: null,
      enrollment_year: new Date().getFullYear(),
      is_seller: false,
      rating: 0.0,
      total_reviews: 0,
    },
    { onConflict: "id" },
  );

  if (studentError) {
    await db.from("users").delete().eq("id", userId);
    console.error("Signup students upsert error:", studentError);
    redirect(buildSignupErrorRedirect(studentError.message, redirectTo));
  }

  // Alimentar a fila de aprovação do admin.
  // Não bloqueamos o signup em caso de falha — a conta já foi criada com sucesso.
  const { error: enrollmentError } = await db.from("enrollment_verifications").insert({
    user_id: userId,
    enrollment_code: studentId,
    submitted_at: new Date().toISOString(),
    status: "pending",
  });

  if (enrollmentError) {
    console.error("Signup enrollment_verifications insert error:", enrollmentError);
  }

  if (redirectTo && redirectTo !== "/login" && redirectTo !== "/signup") {
    redirect(redirectTo);
  }

  redirect("/home?message=" + encodeURIComponent("Conta criada com sucesso."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Recuperação de password ──────────────────────────────────────────────────

export async function sendPasswordReset(payload: {
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const email = payload.email.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { success: false, error: "Introduz um email válido." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/recover/update`,
  });

  if (error) {
    console.error("sendPasswordReset error:", error);
    return { success: false, error: "Não foi possível enviar o email. Tenta novamente." };
  }

  return { success: true };
}

export async function updatePassword(payload: {
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { password } = payload;

  if (!password || password.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("updatePassword error:", error);
    return { success: false, error: "Não foi possível atualizar a senha. Tenta novamente." };
  }

  return { success: true };
}