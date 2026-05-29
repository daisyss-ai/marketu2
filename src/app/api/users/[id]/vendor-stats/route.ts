import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
<<<<<<< HEAD
  request: Request,
=======
  _request: Request,
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

<<<<<<< HEAD
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
=======
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
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      },
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
<<<<<<< HEAD
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
=======
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
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
  }
}
