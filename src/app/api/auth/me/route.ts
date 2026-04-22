import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth';
import type { ErrorResponse, SuccessResponse } from '@/types';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Call auth service
    const result = await getCurrentUser();

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to get current user',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const response: SuccessResponse<typeof result.data> = {
      data: result.data,
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
