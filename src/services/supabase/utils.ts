import type { PostgrestError, AuthError } from '@supabase/supabase-js';

export interface ErrorResponse {
  error: true;
  message: string;
  code?: string;
  details?: string;
}

/**
 * Handle Supabase errors and convert to user-friendly messages
 */
export function handleSupabaseError(
  error: PostgrestError | AuthError | Error | null | undefined
): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle PostgreSQL errors
  if ('code' in error && 'message' in error) {
    const pgError = error as PostgrestError;

    switch (pgError.code) {
      case '23505': // Unique violation
        return 'This record already exists. Please try another value.';
      case '23503': // Foreign key violation
        return 'The referenced record does not exist.';
      case '23502': // Not null violation
        return 'Please fill in all required fields.';
      case '42P01': // Table not found
        return 'Database error: table not found.';
      default:
        return pgError.message || 'A database error occurred';
    }
  }

  // Handle Auth errors
  if ('status' in error && 'message' in error) {
    const authError = error as AuthError;
    const msg = (authError.message || '').toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please verify your email before logging in';
    }
    if (msg.includes('user already registered')) {
      return 'This email is already registered';
    }
    if (msg.includes('password')) {
      return 'Password is invalid or too weak';
    }

    return authError.message || 'Authentication error';
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  return 'An unknown error occurred';
}

/**
 * Format error into structured response
 */
export function formatDatabaseError(
  error: PostgrestError | AuthError | Error | null | undefined
): ErrorResponse {
  const message = handleSupabaseError(error);
  const code = (error && 'code' in error && error.code) ? error.code : 'UNKNOWN_ERROR';

  return {
    error: true,
    message,
    code,
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if error is a specific type
 */
export function isAuthError(error: unknown): error is AuthError {
  return error !== null && typeof error === 'object' && 'status' in error && 'message' in error;
}

/**
 * Check if error is a database error
 */
export function isDatabaseError(error: unknown): error is PostgrestError {
  return error !== null && typeof error === 'object' && 'code' in error && 'message' in error;
}
