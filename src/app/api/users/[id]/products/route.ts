import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const supabase = await createClient();
    const userId = params.id;

    const page = Math.max(1, toNumber(searchParams.get('page'), 1));
    const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));

    let q = supabase
      .from('products')
      .select('id,title,description,price,created_at', { count: 'exact' })
      .eq('seller_id', userId)
      .eq('is_active', true);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await q.range(from, to);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const products = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      created_at: p.created_at,
    }));

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}
