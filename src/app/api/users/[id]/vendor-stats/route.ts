import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const userId = params.id;

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId);

    // Get active products
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .eq('is_active', true);

    // Get total sales (sum of prices of sold products)
    const { data: soldProducts } = await supabase
      .from('products')
      .select('price')
      .eq('seller_id', userId)
      .eq('is_active', false);

    const totalSales = (soldProducts || []).reduce((acc, p) => acc + (p.price || 0), 0);

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalSales,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
