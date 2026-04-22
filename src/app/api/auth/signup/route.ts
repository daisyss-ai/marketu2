import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/services/auth';
import { validateSignupForm } from '@/utils/validation';
import type { ErrorResponse, SuccessResponse, AuthResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { email, password, confirmPassword, student_id, first_name, last_name } = body;

    // Validate input
    const validation = validateSignupForm({
      email,
      password,
      confirmPassword,
      studentId: student_id,
      firstName: first_name,
      lastName: last_name,
    });

    if (!validation.valid) {
      const response: ErrorResponse = {
        error: true,
        message: 'Validation failed',
        details: validation.errors,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Call auth service
    const result = await signUp(email, password, student_id, first_name, last_name);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Signup failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: SuccessResponse<AuthResponse> = {
      data: {
        user: {
          id: result.data!.id,
          email: result.data!.email || '',
          student_id: result.data!.studentId || '',
          first_name: result.data!.firstName || '',
          last_name: result.data!.lastName || '',
          student_id_verified: result.data!.studentIdVerified || false,
        },
        session: {
          access_token: '',
          refresh_token: '',
          expires_in: 3600,
        },
      },
      message: 'Signup successful. Please check your email to verify your account.',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred during signup',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
