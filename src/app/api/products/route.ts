import { NextResponse, type NextRequest } from 'next/server';
import { getProducts } from '@/lib/products/getProducts';
import { createClient } from '@/lib/supabase/server';
import { mockProducts } from './_mock';
import {
  applyDatabaseFilters,
  applyDatabaseSorting,
  buildSearchMeta,
  mapProductRow,
  parseProductQuery,
  searchProductsInMemory,
  searchProductsWithRpc,
} from './_search';

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

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function buildLegacyPayload(products: unknown[], meta: ReturnType<typeof buildSearchMeta>) {
  return {
    products,
    total: meta.pagination.total,
    page: meta.pagination.page,
    limit: meta.pagination.limit,
    totalPages: meta.pagination.totalPages,
    hasNextPage: meta.pagination.hasNextPage,
    hasPrevPage: meta.pagination.hasPrevPage,
    sort: meta.sort,
    appliedFilters: meta.appliedFilters,
    search: meta.search,
    meta,
  };
}

export async function GET(request: NextRequest) {
  const query = parseProductQuery(request.nextUrl.searchParams);

  if (!isSupabaseConfigured()) {
    const result = searchProductsInMemory(mockProducts, query);
    return NextResponse.json({ data: buildLegacyPayload(result.products, result.meta) }, { status: 200 });
  }

  const supabase = await createClient();

  try {
    if (query.search || query.gradeLevel || query.subject || query.productType || query.location) {
      try {
        const result = await searchProductsWithRpc(supabase, query);
        return NextResponse.json({ data: buildLegacyPayload(result.products, result.meta) }, { status: 200 });
      } catch {
        let fallbackQuery = supabase
          .from('products_search_view')
          .select('*', { count: 'exact' });

        fallbackQuery = applyDatabaseFilters(fallbackQuery, query, { includeSearch: false });

        if (query.search) {
          fallbackQuery = fallbackQuery.ilike('title', `%${query.search}%`);
        }

        fallbackQuery = applyDatabaseSorting(fallbackQuery, query);

        const initialMeta = buildSearchMeta(query, 0);
        fallbackQuery = fallbackQuery.range(initialMeta.pagination.offset, initialMeta.pagination.to - 1);

        const { data, error, count } = await fallbackQuery;

        if (error) {
          throw error;
        }

        const products = (data || []).map(mapProductRow);
        const resolvedMeta = buildSearchMeta(query, count || 0);
        return NextResponse.json({ data: buildLegacyPayload(products, resolvedMeta) }, { status: 200 });
      }
    }

    const legacySearchParams = request.nextUrl.searchParams;
    const page = Math.max(1, toNumber(legacySearchParams.get('page'), 1));
    const limit = Math.min(48, Math.max(1, toNumber(legacySearchParams.get('limit'), 12)));
    const sortParam = legacySearchParams.get('sort') || 'newest';
    const sort =
      sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating' || sortParam === 'newest'
        ? sortParam
        : 'newest';
    const search = (legacySearchParams.get('search') || '').trim();
    const category = (legacySearchParams.get('category') || '').trim();
    const minRating = Math.max(0, toNumber(legacySearchParams.get('rating'), 0));
    const minPrice = toNumber(legacySearchParams.get('minPrice'), 0);
    const maxPriceRaw = legacySearchParams.get('maxPrice');
    const maxPrice = maxPriceRaw ? toNumber(maxPriceRaw, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao pesquisar produtos';

    if (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('relation')) {
      const result = searchProductsInMemory(mockProducts, query);
      return NextResponse.json({ data: buildLegacyPayload(result.products, result.meta) }, { status: 200 });
    }

    console.error('[API /products] Erro não tratado:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CreateProductBody | null;

    const title = String(body?.title ?? '').trim();
    const description = String(body?.description ?? '').trim();

    const categoryIdRaw = body?.category_id;
    const category_id = typeof categoryIdRaw === 'string' && categoryIdRaw.trim() ? categoryIdRaw.trim() : null;

    const conditionRaw = body?.condition;
    const condition = conditionRaw === 'digital' || conditionRaw === 'new' || conditionRaw === 'used' ? conditionRaw : null;
    const type = condition === 'digital' ? 'digital_material' : 'physical_product';

    const isFreeRaw = body?.is_free;
    const is_free = typeof isFreeRaw === 'boolean' ? isFreeRaw : false;

    const priceRaw = body?.price;
    const priceNum = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? NaN);

    const quantityRaw = body?.quantity;
    const quantityNum = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw ?? 1);
    const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? Math.floor(quantityNum) : 1;

    if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    if (title.length > 100) return NextResponse.json({ error: 'Título deve ter no máximo 100 caracteres' }, { status: 400 });
    if (description.length < 20 || description.length > 500) {
      return NextResponse.json({ error: 'Descrição deve ter entre 20 e 500 caracteres' }, { status: 400 });
    }
    if (!condition) return NextResponse.json({ error: 'Condição inválida' }, { status: 400 });
    if (!Number.isFinite(priceNum) || priceNum < 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });

    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
