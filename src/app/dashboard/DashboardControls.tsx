'use client';

import React, { useDeferredValue, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'Material Escolar', value: 'material_escolar' },
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Livros', value: 'livros' },
  { label: 'Roupas e Acessórios', value: 'roupas' },
  { label: 'Serviços', value: 'servicos' },
  { label: 'Outros', value: 'outros' },
];

function buildUrl(params: {
  page: number;
  limit: number;
  view: 'grid' | 'list';
  sort: 'newest' | 'price_asc' | 'price_desc';
  category: string;
  search: string;
}) {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('limit', String(params.limit));
  sp.set('view', params.view);
  if (params.sort !== 'newest') sp.set('sort', params.sort);
  if (params.category) sp.set('category', params.category);
  if (params.search) sp.set('search', params.search);
  return `/dashboard?${sp.toString()}`;
}

export default function DashboardControls({
  page,
  limit,
  view,
  sort,
  category,
  search,
}: {
  page: number;
  limit: number;
  view: 'grid' | 'list';
  sort: 'newest' | 'price_asc' | 'price_desc';
  category: string;
  search: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(search);
  const deferredSearch = useDeferredValue(searchInput.trim());

  // Keep local input in sync when the URL changes (pagination, back/forward).
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Push search changes via Suspense-friendly navigation.
  useEffect(() => {
    startTransition(() => {
      router.replace(
        buildUrl({
          page: 1,
          limit,
          view,
          sort,
          category,
          search: deferredSearch,
        })
      );
    });
  }, [category, deferredSearch, limit, router, sort, view]);

  const update = (next: Partial<{ view: 'grid' | 'list'; sort: 'newest' | 'price_asc' | 'price_desc'; category: string }>) => {
    startTransition(() => {
      router.replace(
        buildUrl({
          page: 1,
          limit,
          view: next.view ?? view,
          sort: next.sort ?? sort,
          category: next.category ?? category,
          search: deferredSearch,
        })
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Produtos cadastrados no marketplace</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ view: 'grid' })}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              view === 'grid'
                ? 'bg-[#4B187C] text-white border-[#4B187C]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={view === 'grid'}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => update({ view: 'list' })}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              view === 'list'
                ? 'bg-[#4B187C] text-white border-[#4B187C]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={view === 'list'}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nome do produto..."
                className="w-full sm:w-[340px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#4B187C]/10 focus:border-[#4B187C]/40"
              />
              {isPending && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Carregando...
                </span>
              )}
            </div>

            <select
              value={category}
              onChange={(e) => update({ category: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#4B187C]/10 focus:border-[#4B187C]/40"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:block">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'newest' || v === 'price_asc' || v === 'price_desc') update({ sort: v });
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#4B187C]/10 focus:border-[#4B187C]/40"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
