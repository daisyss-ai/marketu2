'use client';

import React from 'react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  totalProducts?: number;
  page?: number;
  totalPages?: number;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
}

const SkeletonRow = () => (
  <div className="flex gap-4 rounded-2xl border border-muted/10 bg-surface p-4 animate-pulse">
    <div className="h-20 w-24 rounded-xl bg-muted/10 shrink-0" />
    <div className="flex-1">
      <div className="h-4 bg-muted/10 rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted/10 rounded w-5/6 mb-2" />
      <div className="h-3 bg-muted/10 rounded w-2/3 mb-3" />
      <div className="h-4 bg-muted/10 rounded w-24" />
    </div>
  </div>
);

export default function ProductList({
  products = [],
  loading = false,
  error = null,
  totalProducts = 0,
  page = 1,
  totalPages = 1,
  showPagination = true,
  onPageChange = () => {},
}: ProductListProps) {
  if (loading && products.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <p className="text-error font-semibold mb-2">⚠️ {error}</p>
          <p className="text-muted text-sm">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <p className="text-muted text-lg font-medium mb-2">📦 Nenhum produto encontrado</p>
          <p className="text-muted/80 text-sm">Tente mudar os filtros ou verifique sua busca</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {totalProducts > 0 && (
        <div className="mb-4 text-sm text-muted">
          Mostrando <span className="font-semibold">{products.length}</span> de{' '}
          <span className="font-semibold">{totalProducts}</span> produtos
        </div>
      )}

      <div className="space-y-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex gap-4 rounded-2xl border border-muted/10 bg-surface p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-20 w-24 rounded-xl bg-muted/5 overflow-hidden shrink-0">
              <img
                src={p.img || '/assets/placeholder-product.png'}
                alt={p.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    {p.category}
                  </div>
                  <div className="font-bold text-foreground text-sm truncate">{p.title}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-foreground">
                    {typeof p.price === 'number' ? p.price.toLocaleString('pt-AO') : p.price}{' '}
                    <span className="text-[10px] font-black text-muted uppercase">kzs</span>
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">{p.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-muted/10 text-muted cursor-not-allowed'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Anterior
          </button>

          <div className="px-4 py-2 text-sm text-muted">
            Página <span className="font-semibold">{page}</span> de{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === totalPages
                ? 'bg-muted/10 text-muted cursor-not-allowed'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
