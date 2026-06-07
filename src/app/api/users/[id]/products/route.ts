import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    const page = Math.max(1, toNumber(searchParams.get('page'), 1));
    const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));

    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({
        data: {
          products: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      });
    }

    const total = count || 0;
    return NextResponse.json({
      data: {
        products: products || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json({
      data: {
        products: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      },
    });
  }
}
