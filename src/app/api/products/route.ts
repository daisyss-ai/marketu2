import { NextResponse, type NextRequest } from 'next/server';
import { getProducts } from '@/lib/products/getProducts';

function getParam(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? '').trim();
}

function getNumParam(params: URLSearchParams, key: string): number | undefined {
  const v = Number(params.get(key));
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  const page = Math.max(1, Number(p.get('page') ?? 1));
  const limit = Math.min(48, Math.max(1, Number(p.get('limit') ?? 12)));
  const search = getParam(p, 'search');
  const category = getParam(p, 'category');
  const minPrice = getNumParam(p, 'minPrice');
  const maxPrice = getNumParam(p, 'maxPrice');
  const minRating = getNumParam(p, 'rating');

  const sortRaw = getParam(p, 'sort');
  const sort =
    sortRaw === 'price_asc' || sortRaw === 'price_desc' || sortRaw === 'rating'
      ? sortRaw
      : 'newest';

  try {
    const result = await getProducts({
      page,
      limit,
      sort,
      search: search || undefined,
      categorySlug: category || undefined,
      minPrice,
      maxPrice,
      minRating,
    });

    return NextResponse.json({
      data: {
        products: result.products,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
        hasNextPage: result.page * result.limit < result.total,
        hasPrevPage: result.page > 1,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('[API /products]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}