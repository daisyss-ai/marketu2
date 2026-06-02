import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '../../../../utils/supabase/server';
import { mockProducts } from '../_mock';

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function POST() {
  // If there's no DB configured, just return the mock products as "seeded".
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { data: mockProducts.map((p) => ({ success: true, id: p.id })) },
      { status: 200 }
    );
  }

  const supabase = await createSupabaseClient();

  const rows = mockProducts.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    price: typeof p.price === 'number' ? p.price : Number(p.price),
    seller: p.seller,
    img: p.img,
    description: p.description,
    condition: p.condition,
    location: p.location,
    subject: p.subject,
    grade_level: p.gradeLevel,
    product_type: p.productType,
    rating: p.rating,
    reviews: p.reviews,
    created_at: p.createdAt,
  }));

  const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: rows.map((r) => ({ success: true, id: r.id })) },
    { status: 200 }
  );
}

