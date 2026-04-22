'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User, SignupRequest, LoginRequest } from '@/types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  signup: (data: SignupRequest) => Promise<boolean>;
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for authentication state and operations
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const { data } = await response.json();
          setState((prev) => ({
            ...prev,
            user: data,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    fetchUser();
  }, []);

  const signup = useCallback(async (data: SignupRequest): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          confirmPassword: data.password, // Client should provide this
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Signup failed',
        }));
        return false;
      }

      // Note: User should verify email before login
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Login failed',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    signup,
    login,
    logout,
    clearError,
  };
}
