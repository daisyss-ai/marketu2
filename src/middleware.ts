import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isAdminRoute(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

function redirectToHome(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

const PROTECTED_PREFIXES = [
  "/home",
  "/dashboard",
  "/profile",
  "/sell",
  "/chat",
  "/recommendations",
  "/product",
  "/categories",
];

const AUTH_ROUTES = ["/login", "/signup"] as const;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: import('@supabase/supabase-js').User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Token inválido ou expirado
  }

  const path = request.nextUrl.pathname;

  if (isAdminRoute(path)) {
    if (!user) return redirectToHome(request);

    const { data: dbUser, error } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (
      error ||
      !dbUser ||
      dbUser.role !== "admin" ||
      dbUser.status === "suspended"
    ) {
      return redirectToHome(request);
    }

    return response;
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.includes(
    path as (typeof AUTH_ROUTES)[number]
  );
  // Pedidos de Server Action (ex: sendVerificationCode, verifyVerificationCode, signup)
  // chegam como POST com este cabeçalho — não são navegação normal do utilizador.
  const isServerAction = request.headers.get("next-action") !== null;

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path + (request.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // Bloquear acesso às rotas protegidas enquanto a conta está pendente de aprovação.
  // Redireciona para /pending-approval sem fazer query extra se o utilizador não estiver autenticado.
  if (isProtectedRoute && user && path !== "/pending-approval") {
    const { data: dbUser } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    if (dbUser?.status === "pending") {
      const url = request.nextUrl.clone();
      url.pathname = "/pending-approval";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute && user && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};