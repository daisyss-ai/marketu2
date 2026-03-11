import React from 'react';
import ProductCard from './ProductCard';

// Skeleton loader component
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
    <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-200 h-40 md:h-44" />
    <div className="mb-2 h-3 bg-gray-200 rounded w-3/4" />
    <div className="mb-3 h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-3 bg-gray-200 rounded w-1/4" />
  </div>
);

const ProductGrid = ({
  products,
  loading,
  error,
  totalProducts,
  page,
  totalPages,
  onPageChange,
  onToggleFavorite,
  favorites,
}) => {
  // Show loading skeletons
  if (loading && products.length === 0) {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">⚠️ {error}</p>
          <p className="text-gray-600 text-sm">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-600 text-lg font-medium mb-2">
            📦 Nenhum produto encontrado
          </p>
          <p className="text-gray-500 text-sm">
            Tente mudar os filtros ou verifique sua busca
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Product count */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando <span className="font-semibold">{products.length}</span> de{' '}
        <span className="font-semibold">{totalProducts}</span> produtos
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <ProductCard
              product={product}
              onToggleFavorite={onToggleFavorite}
              isFavorited={favorites.includes(product.id)}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Anterior
          </button>

          <div className="px-4 py-2 text-sm text-gray-600">
            Página <span className="font-semibold">{page}</span> de{' '}
            <span className="font-semibold">{totalPages}</span>
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
};

export default ProductGrid;
