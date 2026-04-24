import Link from 'next/link';
import ProductGrid from '@/components/produtos/ProductGrid';
import ProductList from '@/components/produtos/ProductList';
import { getProducts } from '@/lib/products/getProducts';

function buildHref(params: {
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

export default async function DashboardResults({
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
  const { products, total } = await getProducts({
    page,
    limit,
    sort,
    search,
    categorySlug: category,
  });

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 12)));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const commonProps = {
    products,
    loading: false,
    error: null as string | null,
    totalProducts: total,
    page,
    totalPages,
    showPagination: false,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      {view === 'list' ? (
        <ProductList {...commonProps} />
      ) : (
        <ProductGrid {...commonProps} favorites={[]} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Link
            href={buildHref({ page: prevPage, limit, view, sort, category, search })}
            aria-disabled={page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-muted/10 text-muted pointer-events-none'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Anterior
          </Link>

          <div className="px-4 py-2 text-sm text-muted">
            Página <span className="font-semibold">{page}</span> de{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>

          <Link
            href={buildHref({ page: nextPage, limit, view, sort, category, search })}
            aria-disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === totalPages
                ? 'bg-muted/10 text-muted pointer-events-none'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Próximo
          </Link>
        </div>
      )}
    </div>
  );
}

