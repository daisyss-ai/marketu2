import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/services/supabase/server';
import { uploadProductImages } from '@/services/products';
import { validateUUID } from '@/services/supabase/utils';
import type { ErrorResponse } from '@/types';

export async function POST(
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

    // Parse multipart form data
    const formData = await request.formData();
    const files: File[] = [];

    // Collect all files from form data
    for (const entry of formData.entries()) {
      if (entry[1] instanceof File) {
        files.push(entry[1] as File);
      }
    }

    if (files.length === 0) {
      const response: ErrorResponse = {
        error: true,
        message: 'No files provided',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate file count (max 10 images per product)
    if (files.length > 10) {
      const response: ErrorResponse = {
        error: true,
        message: 'Maximum 10 images per product',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate file types and sizes
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        const response: ErrorResponse = {
          error: true,
          message: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`,
        };
        return NextResponse.json(response, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        const response: ErrorResponse = {
          error: true,
          message: `File ${file.name} exceeds 5MB limit`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Upload images
    const result = await uploadProductImages(id, files);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to upload images',
      };
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Images uploaded successfully',
        urls: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
