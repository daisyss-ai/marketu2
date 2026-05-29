import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    // Check if user exists and is a seller
    const { data: user, error: userError } = await supabase
      .from('students')
      .select('is_seller, rating, total_reviews')
      .eq('id', userId)
      .single();

    // If user doesn't exist, return empty stats
    if (userError || !user) {
      return NextResponse.json({
        data: {
          stats: {
            avgRating: 0,
            reviewCount: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
          },
        },
      });
    }

    // If user exists but is not a seller, return basic user stats
    if (!user.is_seller) {
      return NextResponse.json({
        data: {
          stats: {
            avgRating: user.rating || 0,
            reviewCount: user.total_reviews || 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
          },
        },
      });
    }

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId);

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId);

    // Get total revenue (sum of confirmed orders)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', userId)
      .eq('status', 'confirmed');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return NextResponse.json({
      data: {
        rating: user.rating || 0,
        total_reviews: user.total_reviews || 0,
        total_products: totalProducts || 0,
        total_orders: totalOrders || 0,
        total_revenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
