/**
 * Authentication service layer
 * Handles signup, login, logout, and session management
 */

import { createClient as createServerClient } from '@/services/supabase/server';
import { handleSupabaseError } from '@/services/supabase/utils';
import type { User } from '@/types';

export interface AuthServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sign up a new student user
 */
export async function signUp(
  email: string,
  password: string,
  studentId: string,
  firstName: string,
  lastName: string
): Promise<AuthServiceResult<User>> {
  try {
    const supabase = await createServerClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          student_id: studentId,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: handleSupabaseError(authError),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    // Create user profile in database
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      institution_id: 
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      student_id_verified: false,
      avatar_url: null
    });

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return {
        success: false,
        error: handleSupabaseError(profileError),
      };
    }

    return {
      success: true,
      data: {
        id: authData.user.id,
        email,
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        studentId,
        studentIdVerified: false,
        studentId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during signup',
    };
  }
}

/**
 * Log in an existing user
 */
export async function login(
  email: string,
  password: string
): Promise<AuthServiceResult<{ user: User; token: string }>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to load user profile',
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          fullName: `${profileData.first_name} ${profileData.last_name}`.trim(),
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          studentId: profileData.student_id,
          studentIdVerified: profileData.student_id_verified,
          avatarUrl: profileData.avatar_url,
        },
        token: data.session.access_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during login',
    };
  }
}

/**
 * Log out current user
 */
export async function logout(): Promise<AuthServiceResult<void>> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during logout',
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthServiceResult<User>> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to load user profile',
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: `${profileData.first_name} ${profileData.last_name}`,
        studentId: profileData.student_id,
        avatarUrl: profileData.avatar_url,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Validate student ID format
 */
export function validateStudentId(studentId: string): boolean {
  // Must be exactly 5 numbers
  const studentIdRegex = /^[0-9]{5}$/;
  return studentIdRegex.test(studentId);
}

/**
 * Refresh auth session
 */
export async function refreshSession(): Promise<AuthServiceResult<{ token: string }>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return {
        success: false,
        error: 'Failed to refresh session',
      };
    }

    return {
      success: true,
      data: {
        token: data.session.access_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthServiceResult<void>> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email',
    };
  }
}

/**
 * Update user password after reset
 */
export async function updatePassword(password: string): Promise<AuthServiceResult<void>> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}
