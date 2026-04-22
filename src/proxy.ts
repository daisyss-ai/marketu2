import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 * Session will be validated in individual API routes
 */
const PROTECTED_ROUTES = [
  '/sell',
  '/cart',
  '/checkout',
  '/orders',
  '/messages',
  '/profile',
  '/seller',
];

/**
 * Public routes that should redirect to home if user is authenticated
 */
const PUBLIC_AUTH_ROUTES = ['/login', '/signup', '/recover'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for API routes and static files
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For now, allow all requests to proceed
  // Session validation will happen in individual API routes and client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
