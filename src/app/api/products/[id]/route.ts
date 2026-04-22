import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/services/supabase/server';
import { getProduct, updateProduct, deleteProduct } from '@/services/products';
import { validateUUID } from '@/services/supabase/utils';
import type { ErrorResponse } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate UUID
    if (!validateUUID(id)) {
      const response: ErrorResponse = {
        error: true,
        message: 'Invalid product ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await getProduct(id);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Product not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Validate UUID
    if (!validateUUID(id)) {
      const response: ErrorResponse = {
        error: true,
        message: 'Invalid product ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: ErrorResponse = {
        error: true,
        message: 'Not authenticated',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Check if user owns the product
    const { data: product, error: getError } = await (supabase
      .from('products')
      .select('seller_id')
      .eq('id' as any, id as any) as any)
      .single();

    if (getError || !product) {
      const response: ErrorResponse = {
        error: true,
        message: 'Product not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (product.seller_id !== user.id) {
      const response: ErrorResponse = {
        error: true,
        message: 'You do not own this product',
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const result = await updateProduct(id, body);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to update product',
      };
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Validate UUID
    if (!validateUUID(id)) {
      const response: ErrorResponse = {
        error: true,
        message: 'Invalid product ID',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: ErrorResponse = {
        error: true,
        message: 'Not authenticated',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Check if user owns the product
    const { data: product, error: getError } = await (supabase
      .from('products')
      .select('seller_id')
      .eq('id' as any, id as any) as any)
      .single();

    if (getError || !product) {
      const response: ErrorResponse = {
        error: true,
        message: 'Product not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (product.seller_id !== user.id) {
      const response: ErrorResponse = {
        error: true,
        message: 'You do not own this product',
      };
      return NextResponse.json(response, { status: 403 });
    }

    const result = await deleteProduct(id);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to delete product',
      };
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
