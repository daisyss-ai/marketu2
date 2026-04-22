'use client';
import { useEffect } from 'react';
import Header from '../components/layout/Header';
import FilterBar from '../components/FilterBar';
import ProductGrid from '../components/produtos/ProductGrid';
import { useFilters } from '../hooks/useFilters';


const Home = () => {
  const {
    filters,
    sorting,
    page,
    products,
    loading,
    error,
    totalProducts,
    totalPages,
    favorites,
    handleFilterChange,
    handlePriceChange,
    handleSortChange,
    handlePageChange,
    handleClearAllFilters,
    handleToggleFavorite,
    hasActiveFilters,
    getActiveFilterCount,
  } = useFilters();

  useEffect(() => {
    console.log('Home component rendered with filters:', filters);
  }, [filters]);

  // Scroll to products when filters change
  useEffect(() => {
    if (hasActiveFilters()) {
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        setTimeout(() => {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [filters, sorting, page, hasActiveFilters]);

  const handleCompraJaClick = () => {
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* Hero section */}
      <section className="pt-7 pb-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-[#EDE7FF] rounded-2xl px-7 py-8 md:py-9 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="text-left max-w-md">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#2C1A4A] leading-tight">
                Faça Parte Do Primeiro Marketplace Para Estudantes
              </h1>
              <p className="text-sm text-gray-600 mt-3 mb-5">
                Compre e venda com segurança entre estudantes — rápido, simples e
                confiável.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCompraJaClick}
                  className="bg-[#4B187C] hover:bg-[#3E1367] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm no-underline transition-all duration-200 hover:shadow-lg"
                >
                  Compra Já
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto flex justify-center">
              <img
                src="/assets/hero-section-image.png"
                alt="Estudantes felizes fazendo compras"
                className="w-full max-w-sm md:max-w-md object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onPriceChange={handlePriceChange}
        onSortChange={handleSortChange}
        onClearAll={handleClearAllFilters}
        sorting={sorting}
        hasActiveFilters={hasActiveFilters()}
      />

      {/* Products section */}
      <section id="products-section" className="max-w-6xl mx-auto px-6 pb-12 pt-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Produtos em Destaque
            {hasActiveFilters() && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({getActiveFilterCount()} filtro{getActiveFilterCount() > 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          totalProducts={totalProducts}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />
      </section>
    </div>
  );
};

export default Home;