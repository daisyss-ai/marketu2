import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toNumber(searchParams.get('page'), 1));
  const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));
  const sort = searchParams.get('sort') || 'newest';
  const search = (searchParams.get('search') || '').trim();

  const minPrice = toNumber(searchParams.get('minPrice'), 0);
  const maxPriceRaw = searchParams.get('maxPrice');
  const maxPrice = maxPriceRaw ? toNumber(maxPriceRaw, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  try {
    const supabase = await createClient();

    let q = supabase
      .from('products')
      .select('id,title,description,price,created_at', { count: 'exact' })
      .eq('is_active', true);

    if (search) q = q.ilike('title', `%${search}%`);
    if (Number.isFinite(minPrice) && minPrice > 0) q = q.gte('price', minPrice);
    if (Number.isFinite(maxPrice)) q = q.lte('price', maxPrice);

    if (sort === 'price_asc') q = q.order('price', { ascending: true });
    else if (sort === 'price_desc') q = q.order('price', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await q.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to the UI's Product shape used by ProductCard.
    const products = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      category: 'Geral',
      price: Number(p.price ?? 0),
      seller: 'MarketU',
      img: '',
      statusColor: 'bg-green-400',
      description: p.description ?? undefined,
      createdAt: p.created_at ?? undefined,
    }));

    return NextResponse.json({
      data: {
        products,
        total: count ?? products.length,
        page,
        limit,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

