import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products/getProducts';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toNumber(searchParams.get('page'), 1));
  const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));
  const sortParam = searchParams.get('sort') || 'newest';
  const sort =
    sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating' || sortParam === 'newest'
      ? sortParam
      : 'newest';
  const search = (searchParams.get('search') || '').trim();
  const category = (searchParams.get('category') || '').trim(); // expects category slug
  const minRating = Math.max(0, toNumber(searchParams.get('rating'), 0));

  const minPrice = toNumber(searchParams.get('minPrice'), 0);
  const maxPriceRaw = searchParams.get('maxPrice');
  const maxPrice = maxPriceRaw ? toNumber(maxPriceRaw, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  try {
    const { products, total } = await getProducts({
      page,
      limit,
      sort,
      search,
      categorySlug: category,
      minPrice,
      maxPrice,
      minRating,
    });

    return NextResponse.json({
      data: {
        products,
        total,
        page,
        limit,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
