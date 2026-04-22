import { NextRequest, NextResponse } from 'next/server';
import { updatePassword } from '@/services/auth';
import { validatePassword } from '@/utils/validation';
import type { ErrorResponse, SuccessResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { password, confirmPassword } = body;

    // Validate passwords
    if (!password || !confirmPassword) {
      const response: ErrorResponse = {
        error: true,
        message: 'Password and confirmation are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (password !== confirmPassword) {
      const response: ErrorResponse = {
        error: true,
        message: 'Passwords do not match',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      const response: ErrorResponse = {
        error: true,
        message: 'Password does not meet requirements',
        details: passwordValidation.errors,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Update password
    const result = await updatePassword(password);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to update password',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: SuccessResponse<null> = {
      data: null,
      message: 'Password updated successfully',
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
