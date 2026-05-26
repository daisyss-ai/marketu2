/**
 * @file POST /api/products
 * @description Rota para buscar produtos com filtros
 * Otimizada com caching, compressão, timing
 */

import { PAGINATION } from '@/lib/constants/search';
import { searchProducts } from '@/lib/database/queries/products';
import { mergeRankedProducts, rankProducts } from '@/lib/search/ranking';
import { SearchError, SearchErrorCode, SearchQuery, SearchResponse } from '@/types/search';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Validar query de busca
 */
function validateSearchQuery(query: any): SearchQuery {
  if (!query) {
    throw new SearchError(SearchErrorCode.INVALID_QUERY, 'Query vazia', 400);
  }

  // Validar página
  const page = Math.max(1, Math.floor(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, Math.floor(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );

  return {
    search: query.search?.trim() || null,
    filters: {
      category: query.filters?.category || null,
      condition: query.filters?.condition || null,
      price: {
        min: Math.max(0, Number(query.filters?.price?.min) || 0),
        max: Math.min(1000000, Number(query.filters?.price?.max) || 1000000),
      },
      gradeLevel: query.filters?.gradeLevel ? Number(query.filters.gradeLevel) : null,
      subject: query.filters?.subject || null,
      productType: query.filters?.productType || null,
      location: query.filters?.location || null,
      rating: query.filters?.rating ? Number(query.filters.rating) : null,
    },
    sort: query.sort || 'newest',
    page,
    limit,
  };
}

/**
 * Calcular stats para ranking
 */
async function getSearchStats(products: any[]) {
  return {
    maxViews: Math.max(...products.map((p) => p.views || 0), 1),
    maxSales: Math.max(...products.map((p) => p.sales || 0), 1),
    totalProducts: products.length,
    productsWithQuery: products.length,
  };
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const query = validateSearchQuery(body.query);

    // ========================================================================
    // EXECUTAR BUSCA NA DATABASE
    // ========================================================================

    const dbStartTime = performance.now();
    const { products, total } = await searchProducts(query);
    const dbTime = performance.now() - dbStartTime;

    // ========================================================================
    // RANKING (se tem search term)
    // ========================================================================

    let rankedProducts = products;
    let rankingTime = 0;

    if (query.search && products.length > 0) {
      const rankStartTime = performance.now();
      const stats = await getSearchStats(products);
      const ranked = rankProducts(products, query.search, stats);
      rankedProducts = mergeRankedProducts(products, ranked);
      rankingTime = performance.now() - rankStartTime;
    }

    // ========================================================================
    // CALCULAR PAGINATION
    // ========================================================================

    const totalPages = Math.ceil(total / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    // ========================================================================
    // RESPONSE
    // ========================================================================

    const totalTime = performance.now() - startTime;

    const response: SearchResponse = {
      success: true,
      data: {
        products: rankedProducts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        facets: {
          categories: [],
          conditions: [],
          gradeLevel: [],
          subjects: [],
          productTypes: [],
          locations: [],
          priceRanges: [],
        },
        timing: {
          queryTime: dbTime,
          rankingTime,
          totalTime,
        },
      },
    };

    // ========================================================================
    // HEADERS OTIMIZADOS
    // ========================================================================

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache na browser por 5 minutos se sem filtros ativos
        'Cache-Control': !query.search && !Object.values(query.filters).some((f) => f)
          ? 'public, max-age=300, s-maxage=300'
          : 'private, no-cache',
        // Header customizado com timing (para debugging)
        'X-Response-Time': `${totalTime.toFixed(0)}ms`,
        'X-DB-Time': `${dbTime.toFixed(0)}ms`,
        'X-Ranking-Time': `${rankingTime.toFixed(0)}ms`,
      },
    });
  } catch (error: any) {
    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    if (error instanceof SearchError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    console.error('Search API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: SearchErrorCode.DATABASE_ERROR,
          message: 'Erro no servidor ao buscar produtos',
        },
      },
      { status: 500 }
    );
  }
}
