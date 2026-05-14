/**
 * @file Optimized Database Queries
 * @description SQL queries otimizadas para busca, filtragem e paginação
 * Usa índices, evita full scans, prepared statements
 */

import { Product, SearchError, SearchErrorCode, SearchQuery, SearchResult } from '@/types/search';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

/**
 * Query base para busca de produtos
 * Evita SELECT *, especifica colunas necessárias
 */
const PRODUCT_COLUMNS = [
  'id',
  'title',
  'price',
  'category',
  'description',
  'condition',
  'location',
  'product_type',
  'grade_level',
  'subject',
  'img as image',
  'seller',
  'user_id as sellerId',
  'rating',
  'reviews as reviewCount',
  'views',
  'sales',
  'created_at as createdAt',
  'updated_at as updatedAt',
] as const;

/**
 * Executar busca completa com filtros
 * Otimizada com índices compostos
 */
export async function searchProducts(query: SearchQuery) {
  const supabase = await createSupabaseClient();

  // Base query - usar view com subject/grade_level joined
  let baseQuery = supabase
    .from('products_search_view')
    .select(PRODUCT_COLUMNS.join(','), { count: 'exact' });

  // ============================================================================
  // APLICAR FILTROS (usa índices simples e compostos)
  // ============================================================================

  if (query.filters.category) {
    baseQuery = baseQuery.eq('category', query.filters.category);
  }

  if (query.filters.condition) {
    baseQuery = baseQuery.eq('condition', query.filters.condition);
  }

  if (query.filters.location) {
    baseQuery = baseQuery.eq('location', query.filters.location);
  }

  if (query.filters.productType) {
    baseQuery = baseQuery.eq('product_type', query.filters.productType);
  }

  if (query.filters.subject) {
    baseQuery = baseQuery.eq('subject', query.filters.subject);
  }

  if (query.filters.gradeLevel) {
    baseQuery = baseQuery.eq('grade_level', query.filters.gradeLevel);
  }

  if (query.filters.rating) {
    baseQuery = baseQuery.gte('rating', query.filters.rating);
  }

  // ============================================================================
  // PRICE RANGE (usa índice range)
  // ============================================================================

  if (query.filters.price.min > 0) {
    baseQuery = baseQuery.gte('price', query.filters.price.min);
  }

  if (query.filters.price.max < 1000000) {
    baseQuery = baseQuery.lte('price', query.filters.price.max);
  }

  // ============================================================================
  // SEARCH (usa índices de ILIKE - GIN trgm)
  // ============================================================================

  if (query.search) {
    // Escape special characters para ILIKE
    const searchTerm = query.search.replace(/%/g, '\\%').replace(/_/g, '\\_');

    // OR query em múltiplos campos - aproveita índices
    baseQuery = baseQuery.or(
      [
        `title.ilike.%${searchTerm}%`,
        `description.ilike.%${searchTerm}%`,
        `subject.ilike.%${searchTerm}%`,
        `category.ilike.%${searchTerm}%`,
      ].join(',')
    );
  }

  // ============================================================================
  // ORDERING (usa índices de sorting)
  // ============================================================================

  switch (query.sort) {
    case 'price_asc':
      baseQuery = baseQuery.order('price', { ascending: true });
      break;
    case 'price_desc':
      baseQuery = baseQuery.order('price', { ascending: false });
      break;
    case 'rating':
      baseQuery = baseQuery.order('rating', { ascending: false, nullsFirst: false });
      break;
    case 'most_viewed':
      baseQuery = baseQuery.order('views', { ascending: false });
      break;
    case 'newest':
    default:
      baseQuery = baseQuery.order('created_at', { ascending: false });
      break;
  }

  // ============================================================================
  // PAGINATION (sempre usar range, nunca offset grande)
  // Offset pode ser lento em DBs grandes, considerar cursor pagination
  // ============================================================================

  const offset = (query.page - 1) * query.limit;
  baseQuery = baseQuery.range(offset, offset + query.limit - 1);

  // ============================================================================
  // EXECUTAR QUERY
  // ============================================================================

  const { data, error, count } = await baseQuery;

  if (error) {
    throw new SearchError(
      SearchErrorCode.DATABASE_ERROR,
      'Erro ao buscar produtos: ' + error.message,
      500
    );
  }

  return {
    products: data as SearchResult[],
    total: count || 0,
  };
}

/**
 * Query para autocomplete/sugestões
 * Otimizada para velocidade (LIMIT baixo, índice BRIN)
 */
export async function getSuggestions(searchTerm: string, limit: number = 5) {
  const supabase = await createSupabaseClient();

  const sanitizedTerm = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');

  // Buscar títulos únicos que começam com termo (muito rápido)
  const { data: titles } = await supabase
    .from('products')
    .select('title')
    .ilike('title', `${sanitizedTerm}%`)
    .limit(limit)
    .order('created_at', { ascending: false });

  // Buscar categorias que começam com termo
  const { data: categories } = await supabase
    .from('products')
    .select('category')
    .ilike('category', `${sanitizedTerm}%`)
    .limit(5)
    .distinct();

  // Buscar subjects que começam com termo
  const { data: subjects } = await supabase
    .from('products')
    .select('subject')
    .ilike('subject', `${sanitizedTerm}%`)
    .limit(5)
    .distinct();

  return {
    titles: [...new Set(titles?.map((t) => t.title) || [])],
    categories: [...new Set(categories?.map((c) => c.category) || [])],
    subjects: [...new Set(subjects?.map((s) => s.subject) || [])],
  };
}

/**
 * Query para facets (contagem de valores únicos para filtros)
 * Usado para popular dropdown de filtros com counts
 */
export async function getFacets() {
  const supabase = await createSupabaseClient();

  // Nota: Para grandes datasets, considerar cache Redis
  // Esta query pode ser lenta em milhões de produtos

  const [categories, conditions, locations, productTypes, subjects] = await Promise.all([
    supabase
      .from('products')
      .select('category')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
          counts[row.category] = (counts[row.category] || 0) + 1;
        });
        return Object.entries(counts).map(([value, count]) => ({ value, count }));
      }),

    supabase
      .from('products')
      .select('condition')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
          counts[row.condition] = (counts[row.condition] || 0) + 1;
        });
        return Object.entries(counts).map(([value, count]) => ({ value, count }));
      }),

    supabase
      .from('products')
      .select('location')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
          counts[row.location] = (counts[row.location] || 0) + 1;
        });
        return Object.entries(counts).map(([value, count]) => ({ value, count }));
      }),

    supabase
      .from('products')
      .select('product_type')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
          counts[row.product_type] = (counts[row.product_type] || 0) + 1;
        });
        return Object.entries(counts).map(([value, count]) => ({ value, count }));
      }),

    supabase
      .from('products')
      .select('subject')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
          counts[row.subject] = (counts[row.subject] || 0) + 1;
        });
        return Object.entries(counts).map(([value, count]) => ({ value, count }));
      }),
  ]);

  return {
    categories,
    conditions,
    locations,
    productTypes,
    subjects,
  };
}

/**
 * Query para single product detail
 * Otimizada com índice em user_id
 */
export async function getProductDetail(productId: string | number) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS.join(','))
    .eq('id', productId)
    .single();

  if (error) {
    throw new SearchError(
      SearchErrorCode.NOT_FOUND,
      'Produto não encontrado',
      404
    );
  }

  return data as Product;
}

/**
 * Query para produtos do usuário (seller)
 * Usa índice composto (user_id, created_at DESC)
 */
export async function getUserProducts(userId: string, page: number = 1, limit: number = 20) {
  const supabase = await createSupabaseClient();

  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS.join(','), { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new SearchError(
      SearchErrorCode.DATABASE_ERROR,
      'Erro ao buscar produtos do usuário',
      500
    );
  }

  return {
    products: data as SearchResult[],
    total: count || 0,
  };
}

/**
 * Query para produtos em destaque (homepage)
 * Produtos bem-avaliados e recentes
 * Usa partial index (rating >= 4.0)
 */
export async function getFeaturedProducts(limit: number = 12) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS.join(','))
    .gte('rating', 4.0)
    .gt('reviews', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new SearchError(
      SearchErrorCode.DATABASE_ERROR,
      'Erro ao buscar produtos em destaque',
      500
    );
  }

  return data as SearchResult[];
}

/**
 * Incrementar views de um produto
 * Atômico, seguro
 */
export async function incrementProductViews(productId: string | number) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from('products')
    .update({ views: supabase.rpc('increment_views', { product_id: productId }) })
    .eq('id', productId);

  if (error) {
    console.error('Error incrementing views:', error);
  }
}

/**
 * Query para trending products (mais vistos/vendidos recentemente)
 */
export async function getTrendingProducts(limit: number = 10, days: number = 7) {
  const supabase = await createSupabaseClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS.join(','))
    .gte('created_at', sinceDate.toISOString())
    .order('views', { ascending: false })
    .order('sales', { ascending: false })
    .limit(limit);

  if (error) {
    throw new SearchError(
      SearchErrorCode.DATABASE_ERROR,
      'Erro ao buscar produtos em tendência',
      500
    );
  }

  return data as SearchResult[];
}
