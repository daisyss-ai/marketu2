import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const [
      { data: products, error: productsError },
      { count: completedSales, error: ordersError },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id, rating, total_reviews, total_sales')
        .eq('seller_id', userId)
        .eq('is_active', true),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'delivered'),
    ]);

    if (productsError) throw productsError;
    if (ordersError) throw ordersError;

    const productCount = products?.length || 0;
    const reviewCount = products?.reduce((sum, p) => sum + (p.total_reviews || 0), 0) || 0;
    const ratingSum = products?.reduce((sum, p) => sum + (p.rating || 0) * (p.total_reviews || 0), 0) || 0;
    const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0;
    const totalSales = products?.reduce((sum, p) => sum + (p.total_sales || 0), 0) || 0;
    const positiveRating = reviewCount === 0 ? '0%' : `${Math.round((avgRating / 5) * 100)}%`;

    return NextResponse.json({
      data: {
        stats: {
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount,
          productCount,
          completedSales: completedSales || 0,
          totalSales,
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
          totalSales: 0,
          positiveRating: '0%',
        },
      },
    });
  }
}