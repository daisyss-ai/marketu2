import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/services/auth';
import type { ErrorResponse, SuccessResponse } from '@/types';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    // Call auth service
    const result = await logout();

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Logout failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: SuccessResponse<{ message: string }> = {
      data: {
        message: 'Logout successful',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred during logout',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
