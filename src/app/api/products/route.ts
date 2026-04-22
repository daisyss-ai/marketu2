import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/services/supabase/server';
import { searchProducts, createProduct } from '@/services/products';
import type { ErrorResponse, ProductResponse, ProductListResponse } from '@/types';

/**
 * GET /api/products - List and search products
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      condition: searchParams.get('condition') || undefined,
      status: (searchParams.get('status') || 'available') as
        | 'available'
        | 'sold'
        | 'reserved',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      perPage: searchParams.get('perPage') ? Number(searchParams.get('perPage')) : 20,
    };

    const result = await searchProducts(filters);

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to search products',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ProductListResponse = {
      products: (result.data!.products as any) as ProductResponse[],
      total: result.data!.total,
      page: filters.page,
      per_page: filters.perPage,
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

/**
 * POST /api/products - Create new product
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();

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

    const body = await request.json();
    const { title, description, category, price, condition } = body;

    // Validate required fields
    if (!title || !description || !category || price === undefined || !condition) {
      const response: ErrorResponse = {
        error: true,
        message: 'Missing required fields',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate price
    if (typeof price !== 'number' || price <= 0) {
      const response: ErrorResponse = {
        error: true,
        message: 'Price must be a positive number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create product
    const result = await createProduct(user.id, {
      title,
      description,
      category,
      price,
      condition,
    });

    if (!result.success) {
      const response: ErrorResponse = {
        error: true,
        message: result.error || 'Failed to create product',
      };
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    const response: ErrorResponse = {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
