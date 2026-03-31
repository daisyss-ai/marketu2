import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import FilterBar from '../components/FilterBar';
import ProductGrid from '../components/produtos/ProductGrid';
import { useFilters } from '../hooks/useFilters';
import { createSampleProducts } from '../services/api';
import { useAuthStore } from '../store/authStore';
import heroImg from '../assets/hero-section-image.png';

const Home = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [creatingProducts, setCreatingProducts] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  
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

  const handleCreateSampleProducts = async () => {
    setCreatingProducts(true);
    try {
      const results = await createSampleProducts();
      const successful = results.filter((r) => r.success).length;
      console.log(`Created ${successful} sample products`);
      // Refresh the products list by clearing filters
      handleClearAllFilters();
    } catch (err) {
      console.error('Error creating sample products:', err);
      alert('Erro ao criar produtos de exemplo. Verifique o console.');
    } finally {
      setCreatingProducts(false);
    }
  };

  const handleDevLogin = async () => {
    setLoggingIn(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.data) {
        // Save to auth store
        login({ ...data.data.user, token: data.data.token });
        alert('✅ Login de teste realizado! Redirecionando para publicar produto...');
        navigate('/sell');
      }
    } catch (err) {
      alert('❌ Erro ao fazer login de teste');
      console.error(err);
    } finally {
      setLoggingIn(false);
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
                <button
                  onClick={handleDevLogin}
                  disabled={loggingIn}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm no-underline transition-all duration-200 ${
                    loggingIn
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  title="Quick login as test vendor for product creation"
                >
                  {loggingIn ? 'Entrando...' : '🚀 Vender (Teste)'}
                </button>
                <button
                  onClick={handleCreateSampleProducts}
                  disabled={creatingProducts}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm no-underline transition-all duration-200 ${
                    creatingProducts
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-white text-[#4B187C] border border-[#4B187C] hover:bg-purple-50'
                  }`}
                >
                  {creatingProducts ? 'Criando...' : '+ Criar Produtos de Teste'}
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto flex justify-center">
              <img
                src={heroImg}
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
        activeFilterCount={getActiveFilterCount()}
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
