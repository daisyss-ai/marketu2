import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/services/auth';
import { validateEmail } from '@/utils/validation';
import type { ErrorResponse, SuccessResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !validateEmail(email)) {
      const response: ErrorResponse = {
        error: true,
        message: 'Invalid email address',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Send password reset email
    const result = await resetPassword(email);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to send reset email',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: SuccessResponse<null> = {
      data: null,
      message: 'Password reset email sent successfully. Please check your email for instructions.',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
