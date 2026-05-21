import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products/getProducts';
import { createClient } from '@/lib/supabase/server';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toNumber(searchParams.get('page'), 1));
  const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));
  const sortParam = searchParams.get('sort') || 'newest';
  const sort =
    sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating' || sortParam === 'newest'
      ? sortParam
      : 'newest';
  const search = (searchParams.get('search') || '').trim();
  const category = (searchParams.get('category') || '').trim(); // slug
  const minRating = Math.max(0, toNumber(searchParams.get('rating'), 0));

  const minPrice = toNumber(searchParams.get('minPrice'), 0);
  const maxPriceRaw = searchParams.get('maxPrice');
  const maxPrice = maxPriceRaw ? toNumber(maxPriceRaw, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  try {
    const { products, total } = await getProducts({
      page,
      limit,
      sort,
      search,
      categorySlug: category,
      minPrice,
      maxPrice,
      minRating,
    });

    return NextResponse.json({
      data: {
        products,
        total,
        page,
        limit,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'nodejs';

type CreateProductBody = {
  title?: unknown;
  description?: unknown;
  category_id?: unknown;
  condition?: unknown;
  price?: unknown;
  is_free?: unknown;
  quantity?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CreateProductBody | null;

    const title = String(body?.title ?? '').trim();
    const description = String(body?.description ?? '').trim();

    const categoryIdRaw = body?.category_id;
    const category_id = typeof categoryIdRaw === 'string' && categoryIdRaw.trim() ? categoryIdRaw.trim() : null;

    const conditionRaw = body?.condition;
    const condition = conditionRaw === 'digital' || conditionRaw === 'new' || conditionRaw === 'used' ? conditionRaw : null;
    // Keep in sync with DB enum `product_type`
    const type = condition === 'digital' ? 'digital_material' : 'physical_product';

    const isFreeRaw = body?.is_free;
    const is_free = typeof isFreeRaw === 'boolean' ? isFreeRaw : false;

    const priceRaw = body?.price;
    const priceNum = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? NaN);

    const quantityRaw = body?.quantity;
    const quantityNum = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw ?? 1);
    const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? Math.floor(quantityNum) : 1;

    if (!title) return NextResponse.json({ error: 'TÃ­tulo Ã© obrigatÃ³rio' }, { status: 400 });
    if (title.length > 100) return NextResponse.json({ error: 'TÃ­tulo deve ter no mÃ¡ximo 100 caracteres' }, { status: 400 });
    if (description.length < 20 || description.length > 500) {
      return NextResponse.json({ error: 'DescriÃ§Ã£o deve ter entre 20 e 500 caracteres' }, { status: 400 });
    }
    if (!condition) return NextResponse.json({ error: 'CondiÃ§Ã£o invÃ¡lida' }, { status: 400 });
    if (!Number.isFinite(priceNum) || priceNum < 0) return NextResponse.json({ error: 'PreÃ§o invÃ¡lido' }, { status: 400 });

    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
    if (!auth?.user) return NextResponse.json({ error: 'NÃ£o autenticado' }, { status: 401 });

    const userId = auth.user.id;

    const { data: created, error: createError } = await supabase
      .from('products')
      .insert({
        seller_id: userId,
        category_id,
        type,
        title,
        description,
        price: is_free ? 0 : priceNum,
        is_free,
        is_active: true,
        is_approved: false,
      })
      .select('id')
      .single();

    if (createError || !created?.id) {
      const message = createError?.message || 'Falha ao criar produto';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const productId = created.id as string;

    const { error: stockError } = await supabase.from('product_stock').insert({ product_id: productId, quantity });
    if (stockError) return NextResponse.json({ error: stockError.message }, { status: 400 });

    const { error: moderationError } = await supabase
      .from('content_moderation')
      .insert({ product_id: productId, status: 'pending' });
    if (moderationError) return NextResponse.json({ error: moderationError.message }, { status: 400 });

    return NextResponse.json({ data: { id: productId, seller_id: userId } }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
