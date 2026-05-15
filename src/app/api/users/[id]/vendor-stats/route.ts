import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    // Get product count and stats
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('rating, total_reviews')
      .eq('seller_id', userId);

    if (productsError) throw productsError;

    const productCount = products?.length || 0;
    const avgRating =
      products && products.length > 0
        ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length
        : 0;
    const reviewCount = products?.reduce((sum, p) => sum + (p.total_reviews || 0), 0) || 0;

    // Get completed sales count
    const { count: completedSales, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .eq('status', 'completed');

    if (ordersError) throw ordersError;

    // Calculate positive rating percentage
    const positiveRating =
      reviewCount === 0 ? '0%' : `${Math.round((avgRating / 5) * 100)}%`;

    return NextResponse.json({
      data: {
        stats: {
          avgRating,
          reviewCount,
          productCount,
          completedSales: completedSales || 0,
          positiveRating,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json({
      data: {
        stats: {
          avgRating: 0,
          reviewCount: 0,
          productCount: 0,
          completedSales: 0,
          positiveRating: '0%',
        },
      },
    });
  }
}
