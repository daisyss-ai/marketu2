import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/auth';
import { validateLoginForm } from '@/utils/validation';
import type { ErrorResponse, SuccessResponse, AuthResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { email, password } = body;

    // Validate input
    const validation = validateLoginForm({ email, password });

    if (!validation.valid) {
      const response: ErrorResponse = {
        error: true,
        message: 'Validation failed',
        details: validation.errors,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Call auth service
    const result = await login(email, password);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Login failed',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const response: SuccessResponse<AuthResponse> = {
      data: {
        user: {
          id: result.data!.user.id,
          email: result.data!.user.email || '',
          student_id: result.data!.user.studentId || '',
          first_name: result.data!.user.fullName?.split(' ')[0] || '',
          last_name: result.data!.user.fullName?.split(' ')[1] || '',          student_id_verified: result.data!.user.studentIdVerified || false,        },
        session: {
          access_token: result.data!.token,
          refresh_token: '',
          expires_in: 3600,
        },
      },
      message: 'Login successful',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred during login',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
