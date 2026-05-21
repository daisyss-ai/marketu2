/**
 * @file Refactored ProductGrid Component
 * @description Grid de produtos otimizado com React Query
 * Substitui: src/components/produtos/ProductGrid.tsx
 */

'use client';

import { SearchResult } from '@/types/search';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';
import ProductCard from './ProductCard.refactored';

interface ProductGridProps {
  products: SearchResult[];
  loading?: boolean;
  error?: string | null;
  totalProducts?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Skeleton loader otimizado (memoizado)
 */
const SkeletonCard = React.memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
    <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-200 h-40 md:h-44" />
    <div className="mb-2 h-3 bg-gray-200 rounded w-3/4" />
    <div className="mb-3 h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-3 bg-gray-200 rounded w-1/4" />
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Componente grid refatorado
 * - Memoizado para evitar rerenders desnecessários
 * - Suporta loading states
 * - Error handling
 * - Paginação
 */
export const ProductGrid = React.memo(function ProductGrid({
  products = [],
  loading = false,
  error = null,
  totalProducts = 0,
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
}: ProductGridProps) {
  // Usar useMemo para evitar recalcular skeleton
  const skeletonCards = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => (
      <SkeletonCard key={`skeleton-${i}`} />
    ));
  }, []);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
        {skeletonCards}
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 text-lg font-medium">{error}</p>
        <p className="text-gray-500 text-sm mt-2">Tente novamente ou entre em contato com suporte</p>
      </div>
    );
  }

  // ========================================================================
  // NO RESULTS STATE
  // ========================================================================

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 text-lg font-medium mb-2">📦 Nenhum produto encontrado</p>
        <p className="text-gray-500 text-sm">Tente mudar os filtros ou verifique sua busca</p>
      </div>
    );
  }

  // ========================================================================
  // SUCCESS STATE
  // ========================================================================

  return (
    <div>
      {/* Product count */}
      {totalProducts > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold">{products.length}</span> de{' '}
          <span className="font-semibold">{totalProducts}</span> produtos
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
        {products.map((product) => (
          <ProductCard
            key={`${product.id}-${page}`}
            product={product}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Anterior
          </button>

          {/* Page indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (page > 3) {
                  pageNum = page - 2 + i;
                }
                if (pageNum > totalPages) return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Próximo
            <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      )}

      {/* Fade in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
