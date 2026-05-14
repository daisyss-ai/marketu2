import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '../../../utils/supabase/server';
import { mockProducts } from './_mock';
import {
  applyDatabaseFilters,
  applyDatabaseSorting,
  buildPortugueseSearchQuery,
  buildSearchMeta,
  mapProductRow,
  parseProductQuery,
  searchProductsInMemory,
  searchProductsWithRpc,
} from './_search';

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

  const supabase = await createSupabaseClient();

  try {
    if (query.search) {
      try {
        const result = await searchProductsWithRpc(supabase, query);
        return NextResponse.json({ data: buildLegacyPayload(result.products, result.meta) }, { status: 200 });
      }catch (rpcError: unknown) {
         const message = rpcError instanceof Error ? rpcError.message : (rpcError as any)?.message || '';
         const normalizedMessage = message.toLowerCase();


        let fallbackQuery = supabase
        .from('products_search_view')
        .select('*', { count: 'exact' });

        fallbackQuery = applyDatabaseFilters(fallbackQuery, query, { includeSearch: false });

        fallbackQuery = fallbackQuery.ilike('title', `%${query.search}%`);
          
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

    let dbQuery = supabase.from('products_search_view').select('*', { count: 'exact' });
    dbQuery = applyDatabaseFilters(dbQuery, query);
    dbQuery = applyDatabaseSorting(dbQuery, query);

    const meta = buildSearchMeta(query, 0);
    dbQuery = dbQuery.range(meta.pagination.offset, meta.pagination.to - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw error;
    }

    const products = (data || []).map(mapProductRow);
    const resolvedMeta = buildSearchMeta(query, count || 0);

    return NextResponse.json({ data: buildLegacyPayload(products, resolvedMeta) }, { status: 200 });
  } catch (error: unknown) {
    const message = (error as any) ?.message || String(error);

    if (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('relation')) {
      const result = searchProductsInMemory(mockProducts, query);
      return NextResponse.json({ data: buildLegacyPayload(result.products, result.meta) }, { status: 200 });
    }

    console.error('[API /products] Erro não tratado:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: message || 'Erro interno ao pesquisar produtos' }, { status: 500 });
  }
}
