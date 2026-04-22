import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Server-side Supabase client for API routes and server components
 * Handles request context and cookie management for authentication
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            // Silently fail - can happen with headers already sent
            console.debug('Error setting cookies:', error);
          }
        },
        remove(name) {
          try {
            cookieStore.delete(name);
          } catch (error) {
            // Silently fail - can happen with headers already sent
            console.debug('Error removing cookie:', error);
          }
        },
      },
    }
  );
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
