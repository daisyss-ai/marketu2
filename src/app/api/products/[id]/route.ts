import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '../../../../utils/supabase/server';
import { mockProducts } from '../_mock';

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!isSupabaseConfigured()) {
    const product = mockProducts.find((p) => String(p.id) === String(id));
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    return NextResponse.json({ data: product }, { status: 200 });
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

  const product = {
    id: data.id,
    title: data.title,
    category: data.category,
    price: data.price,
    seller: data.seller,
    img: data.img,
    description: data.description,
    condition: data.condition,
    location: data.location,
    subject: data.subject,
    gradeLevel: data.grade_level ?? data.gradeLevel ?? null,
    productType: data.product_type ?? data.productType ?? null,
    rating: data.rating,
    reviews: data.reviews,
    createdAt: data.created_at ?? data.createdAt,
    userId: data.user_id ?? data.userId,
  };

  return NextResponse.json({ data: product }, { status: 200 });
}

