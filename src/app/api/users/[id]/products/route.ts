import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: rows, error: productsError, count } = await supabase
      .from('products')
      .select(
        `
          id,
          seller_id,
          category_id,
          type,
          title,
          description,
          price,
          is_free,
          is_active,
          is_approved,
          rating,
          total_reviews,
          total_sales,
          created_at,
          updated_at,
          categories(name),
          product_media(url,is_preview,position),
          product_stock(quantity),
          content_moderation(status)
        `,
        { count: 'exact' }
      )
      .eq('seller_id', userId)
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Return empty list on error instead of 500
      return NextResponse.json({
        data: {
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        },
      });
    }

    const total = count || 0;

    const typedRows = (rows ?? []) as DbProductRow[];
    const products = typedRows.map((p) => {
      const media = Array.isArray(p.product_media) ? p.product_media.filter(Boolean) : [];
      const cover = media.find((m) => m?.is_preview) || media[0] || null;

      const category = p.categories;
      const category_name = Array.isArray(category) ? category[0]?.name ?? null : category?.name ?? null;

      const stockRow = Array.isArray(p.product_stock) ? p.product_stock[0] : p.product_stock;
      const stock = typeof stockRow?.quantity === 'number' ? stockRow.quantity : null;

      const moderationRow = Array.isArray(p.content_moderation) ? p.content_moderation[0] : p.content_moderation;
      const moderation_status = moderationRow?.status ?? null;

      return {
        ...p,
        type: toAppType(p.type),
        preview_url: cover?.url ?? null,
        stock,
        moderation_status,
        category_name,
      };
    });

    return NextResponse.json({
      data: {
        products,
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
    // Return empty list on error
    const page = Math.max(1, toNumber(new URL(request.url).searchParams.get('page'), 1));
    const limit = Math.min(48, Math.max(1, toNumber(new URL(request.url).searchParams.get('limit'), 12)));
    
    return NextResponse.json({
      data: {
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      },
    });
  }
}
