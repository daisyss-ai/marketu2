'use client';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import FilterBar from '../components/FilterBar';
import ProductGrid from '../components/produtos/ProductGrid';
import { useFilters } from '../hooks/useFilters';
import { createSampleProducts } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { createClient } from '@/lib/supabase/client';
import ProductsFeed from '@/app/home/ProductsFeed';
import ErrorBoundary from '@/components/ErrorBoundary';


const Home = () => {
  const navigate = useRouter();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [creatingProducts, setCreatingProducts] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  
  const {
    filters,
    sorting,
    page,
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
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error fetching user:', error);
          setUserLoading(false);
          return;
        }

        if (authUser) {
          // Fetch additional user data from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              id,
              enrollment_code,
              full_name,
              role,
              status,
              institution:institution(name)
            `)
            .eq('id', authUser.id)
            .maybeSingle();

          if (userError) {
            console.error('Error fetching user data:', userError);
          }

          const enrollmentCode =
            userData?.enrollment_code ??
            (authUser.user_metadata as any)?.enrollment_code ??
            (authUser.user_metadata as any)?.studentId;

          const fullName =
            userData?.full_name ??
            (authUser.user_metadata as any)?.full_name ??
            (authUser.user_metadata as any)?.fullName;

          login({
            id: authUser.id,
            email: authUser.email ?? undefined,
            enrollment_code: enrollmentCode,
            full_name: fullName,
            role: userData?.role ?? (authUser.user_metadata as any)?.role,
            status: userData?.status ?? undefined,
            institution: (userData as any)?.institution ?? undefined,
          });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [login]);

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
        navigate.push('/sell');
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

        <ErrorBoundary
          fallback={
            <ProductGrid
              products={[]}
              loading={false}
              error="Erro ao carregar produtos. Tente novamente."
              totalProducts={0}
              page={page}
              totalPages={1}
              onPageChange={handlePageChange}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          }
        >
          <Suspense
            fallback={
              <ProductGrid
                products={[]}
                loading
                error={null}
                totalProducts={0}
                page={page}
                totalPages={1}
                onPageChange={handlePageChange}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            }
          >
            <ProductsFeed
              filters={filters}
              sorting={sorting}
              page={page}
              favorites={favorites}
              onPageChange={handlePageChange}
              onToggleFavorite={handleToggleFavorite}
            />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
};

export default Home;
