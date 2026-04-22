import { Suspense } from 'react';
import DashboardControls from './DashboardControls';
import DashboardResults from './DashboardResults';
import ProductGrid from '@/components/produtos/ProductGrid';
import ProductList from '@/components/produtos/ProductList';

export const dynamic = 'force-dynamic';

function toNumber(v: string | string[] | undefined, fallback: number) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function toString(v: string | string[] | undefined, fallback = '') {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? fallback).toString();
}

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, toNumber(searchParams.page, 1));
  const limit = Math.min(48, Math.max(1, toNumber(searchParams.limit, 12)));

  const viewParam = toString(searchParams.view, 'grid');
  const view: 'grid' | 'list' = viewParam === 'list' ? 'list' : 'grid';

  const sortParam = toString(searchParams.sort, 'newest');
  const sort: 'newest' | 'price_asc' | 'price_desc' =
    sortParam === 'price_asc' || sortParam === 'price_desc' ? sortParam : 'newest';

  const category = toString(searchParams.category, '');
  const search = toString(searchParams.search, '');

  const fallback =
    view === 'list' ? (
      <ProductList products={[]} loading error={null} totalProducts={0} page={page} totalPages={1} showPagination={false} />
    ) : (
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <ProductGrid products={[]} loading error={null} totalProducts={0} page={page} totalPages={1} showPagination={false} favorites={[]} />
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen">
      <DashboardControls page={page} limit={limit} view={view} sort={sort} category={category} search={search} />

      <Suspense fallback={fallback}>
        <DashboardResults page={page} limit={limit} view={view} sort={sort} category={category} search={search} />
      </Suspense>
    </div>
  );
}
