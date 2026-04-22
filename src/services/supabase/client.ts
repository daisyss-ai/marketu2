'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser Supabase client for client-side operations
 * Handles session persistence via cookies
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => {
          // Get all cookies from document
          return document.cookie.split('; ').map((cookie) => {
            const [name, value] = cookie.split('=');
            return { name, value };
          });
        },
        setAll: (cookiesToSet) => {
          // Set cookies in document
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieString = `${name}=${value}; ${
              options?.maxAge ? `max-age=${options.maxAge}; ` : ''
            }${options?.expires ? `expires=${options.expires}; ` : ''}path=/`;
            document.cookie = cookieString;
          });
        },
        remove: (name) => {
          // Remove cookies from document
          document.cookie = `${name}=; max-age=0; path=/`;
        },
      },
    }
  );
}

export type SupabaseClient = ReturnType<typeof createClient>;
