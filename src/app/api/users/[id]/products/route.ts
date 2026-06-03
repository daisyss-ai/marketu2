import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

<<<<<<< HEAD
type DbCategory = { name: string | null } | null;
type DbMedia = { url: string | null; is_preview: boolean | null; position: number | null } | null;
type DbStock = { quantity: number | null } | null;
type DbModeration = { status: string | null } | null;

type DbProductRow = {
  id: string;
  seller_id: string;
  category_id: string | null;
  type: string;
  title: string;
  description: string | null;
  price: number | string | null;
  is_free: boolean | null;
  is_active: boolean | null;
  is_approved: boolean | null;
  rating: number | null;
  total_reviews: number | null;
  total_sales: number | null;
  created_at: string | null;
  updated_at: string | null;
  categories: DbCategory | DbCategory[] | null;
  product_media: DbMedia[] | null;
  product_stock: DbStock | DbStock[] | null;
  content_moderation: DbModeration | DbModeration[] | null;
};

function toAppType(dbType: string): 'physical' | 'digital' | 'service' {
  if (dbType === 'digital_material') return 'digital';
  if (dbType === 'physical_product') return 'physical';
  return 'service';
}

=======
>>>>>>> main
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

<<<<<<< HEAD
    const { data: rows, error: productsError, count } = await supabase
=======
    const { data: products, error, count } = await supabase
>>>>>>> main
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