'use client';
import ProductsFeed from '@/app/home/ProductsFeed';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProductCard from '@/components/produtos/ProductCard';
import { createClient } from '@/lib/supabase/client';
import type { ProductCardItem } from '@/types';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Footer from '../components/layout/Footer';
import CategoriesNav from '../components/layout/CategoriesNav';
import Header from '../components/layout/Header';
import ProductGrid from '../components/produtos/ProductGrid';
import { useFilters } from '../hooks/useFilters';
import { useAuthStore } from '../store/authStore';
import CategoryCards from '@/src/components/CategoryCards';

const Home = () => { 
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const authUser = useAuthStore((state) => state.user);
  const [areaProducts, setAreaProducts] = useState<ProductCardItem[]>([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [followingProducts, setFollowingProducts] = useState<ProductCardItem[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('search') || '';
  });
  
  const {
    filters,
    sorting,
    page,
    favorites,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleToggleFavorite,
    hasActiveFilters,
    getActiveFilterCount,
  } = useFilters();

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error fetching user:', error);
          return;
        }

        if (authUser) {
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

          const { data: profileData } = await supabase
            .from('profiles')
            .select('course')
            .eq('id', authUser.id)
            .maybeSingle();

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
            course: profileData?.course ?? null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, [login]);

  useEffect(() => {
    console.log('Home component rendered with filters:', filters);
  }, [filters]);

  useEffect(() => {
    const fetchTopSellers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, banner_url')
        .not('username', 'is', null)
        .limit(8);
      
      if (data) setTopSellers(data);
    };
    fetchTopSellers();
  }, []);

  useEffect(() => {
    if (!authUser?.course) return;
    const fetchAreaProducts = async () => {
      setAreaLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select(`
          id, title, price, is_free, seller_id, rating, total_reviews,
          categories(name),
          product_media(url, is_preview, position)
        `)
        .eq('is_active', true)
        .limit(10);
      
      if (data) {
        setAreaProducts(data.map((p: any): ProductCardItem => ({
          id: String(p.id),
          title: String(p.title),
          price: Number(p.price ?? 0),
          seller: 'MarketU',
          img: ((p.product_media as any[])?.find((m: any) => m.is_preview)?.url
            || (p.product_media as any[])?.[0]?.url) ?? '',
          category: (Array.isArray(p.categories)
            ? p.categories[0]?.name
            : (p.categories as any)?.name) || 'Geral',
          statusColor: 'bg-green-400',
          rating: typeof p.rating === 'number' ? p.rating : null,
          total_reviews: typeof p.total_reviews === 'number' ? p.total_reviews : 0,
        })));
      }
      setAreaLoading(false);
    };
    fetchAreaProducts();
  }, [authUser?.course]);

  useEffect(() => {
    if (!authUser?.id) return;
    const fetchFollowingProducts = async () => {
      setFollowingLoading(true);
      const supabase = createClient();
      
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', authUser.id);
      
      if (!followsData || followsData.length === 0) {
        setFollowingLoading(false);
        return;
      }

      const followingIds = followsData.map((f: any) => f.following_id);

      const { data } = await supabase
        .from('products')
        .select(`
          id, title, price, is_free, seller_id, rating, total_reviews,
          categories(name),
          product_media(url, is_preview, position)
        `)
        .in('seller_id', followingIds)
        .eq('is_active', true)
        .limit(10);

      if (data) {
        setFollowingProducts(data.map((p: any): ProductCardItem => ({
          id: String(p.id),
          title: String(p.title),
          price: Number(p.price ?? 0),
          seller: 'MarketU',
          img: ((p.product_media as any[])?.find((m: any) => m.is_preview)?.url
            || (p.product_media as any[])?.[0]?.url) ?? '',
          category: (Array.isArray(p.categories)
            ? p.categories[0]?.name
            : (p.categories as any)?.name) || 'Geral',
          statusColor: 'bg-green-400',
          rating: typeof p.rating === 'number' ? p.rating : null,
          total_reviews: typeof p.total_reviews === 'number' ? p.total_reviews : 0,
        })));
      }
      setFollowingLoading(false);
    };
    fetchFollowingProducts();
  }, [authUser?.id]);

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange('search', value);
  };



  return (
    <div className="bg-gray-50 min-h-screen">
         <Header
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleCompraJaClick}
      />

      {/* Categories Navigation Section */}
      <CategoriesNav onCategoryClick={(slug) => handleFilterChange('category', slug)} />

      {/* Hero section */}
      {!isSearching && (
  <section className="pt-7 pb-6">
    <div className="w-full px-10">
      <div
        className="relative px-8 py-20 flex flex-col items-center justify-center gap-8 shadow-sm h-106 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/hero-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay escuro para legibilidade */}
        <div className="absolute inset-0 bg-[#2C1A4A]/50" />

        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-2xl md:text-[50px] font-extrabold text-white leading-tight">
            De Estudante Para Estudante
          </h1>
          <p className="text-2xl text-white/85 mt-3 mb-5">
            Encontre tudo o que você precisa para o seu dia a dia no IPIL com preços que cabem no seu bolso.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCompraJaClick}
              className="bg-[#4B187C] hover:bg-[#3E1367] text-white px-5 py-2.5 rounded-full text-2xl font-semibold shadow-sm no-underline transition-all duration-200 hover:shadow-lg"
            >
              Explorar
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
)}


      {!isSearching && (
  <section className="max-w-7xl mx-auto px-4 py-8">
    <h2 className="text-xl font-bold text-gray-900 mb-6">
      Explorar Categorias
    </h2>
    <CategoryCards />
  </section>
)}

      {/* Products section */}
      {isSearching && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm text-gray-500">Filtrar por:</span>
            <select
              className="text-sm border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4B187C]"
              onChange={(e) => handleFilterChange('category', e.target.value || null)}
              value={filters.category || ''}
            >
              <option value="">Categoria</option>
              <option value="Material Escolar">Material Escolar</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Livros & Apontamentos">Livros & Apontamentos</option>
              <option value="Roupas & Calçados">Roupas & Calçados</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Desporto">Desporto</option>
              <option value="Outros">Outros</option>
            </select>
            <select
              className="text-sm border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4B187C]"
              onChange={(e) => handleFilterChange('condition', e.target.value || null)}
              value={filters.condition || ''}
            >
              <option value="">Estado</option>
              <option value="new">Novo</option>
              <option value="like_new">Como Novo</option>
              <option value="good">Bom</option>
              <option value="fair">Razoável</option>
            </select>
            <select
              className="text-sm border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4B187C]"
              onChange={(e) => handleSortChange(e.target.value || 'newest')}
              value={sorting || ''}
            >
              <option value="">Ordenar por</option>
              <option value="price_asc">Preço: menor primeiro</option>
              <option value="price_desc">Preço: maior primeiro</option>
              <option value="newest">Mais recentes</option>
            </select>
            <span className="flex items-center gap-1 bg-[#EDE7FF] text-[#4B187C] text-sm font-medium px-3 py-1 rounded-full">
              {searchQuery}
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange('search', '');
                }}
                className="ml-1 text-[#4B187C] hover:text-[#2C1A4A] font-bold"
              >
                &times;
              </button>
            </span>
          </div>
        </section>
      )}

      <section id="products-section" className="max-w-7xl mx-auto px-4 pb-12 pt-6">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            {isSearching
              ? `Resultados para "${searchQuery}"`
              : 'Produtos em Destaque'}
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

      {!isSearching && authUser?.course && (
        <section className="max-w-7xl mx-auto px-4 pb-12 pt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
            Produtos da sua área
          </h2>
          {areaLoading ? (
            <div className="text-gray-500 text-sm">Carregando...</div>
          ) : areaProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {areaProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorited={favorites.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Nenhum produto encontrado para a tua área.
            </p>
          )}
        </section>
      )}

      {!isSearching && topSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12 pt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
            Melhores Lojas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topSellers.map((seller) => (
              <div key={seller.id} 
                className="bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                
                <div className="h-28 bg-[#EDE7FF] overflow-hidden">
                  {seller.banner_url ? (
                    <img 
                      src={seller.banner_url} 
                      alt="banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linearto-r from-[#4B187C] to-[#6d28b0]" />
                  )}
                </div>

                <div className="flex flex-col items-center -mt-8 px-4 pb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-[#EDE7FF] flex items-center justify-center shadow-md">
                    {seller.avatar_url ? (
                      <img 
                        src={seller.avatar_url} 
                        alt={seller.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-[#4B187C]">
                        {(seller.username || seller.full_name || 'V')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 font-semibold text-gray-900 text-sm text-center">
                    {seller.username || seller.full_name}
                  </p>
                  
                  <button
                    onClick={() => router.push(`/vendedor/${seller.id}`)}
                    className="mt-3 w-full border border-gray-300 text-gray-700 text-xs font-semibold py-1.5 rounded-full hover:bg-[#EDE7FF] hover:border-[#4B187C] hover:text-[#4B187C] transition-colors"
                  >
                    Ver Loja
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isSearching && authUser && (
        <section className="max-w-7xl mx-auto px-4 pb-12 pt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
            De quem segues
          </h2>
          {followingLoading ? (
            <div className="text-gray-500 text-sm">Carregando...</div>
          ) : followingProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {followingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorited={favorites.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Ainda não segues nenhum vendedor. 
              Explora as lojas e começa a seguir!
            </p>
          )}
        </section>
      )}

      {!isSearching && (
        <section className="w-full bg-[#EDE7FF] py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#4B187C] font-semibold text-lg mb-2">
            A tua opinião importa!
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ajuda-nos a melhorar o MarketU
          </h3>
          <p className="text-gray-600 text-base mb-8 max-w-md mx-auto">
            Partilha a tua experiência e ajuda outros estudantes a 
            comprar e vender com mais confiança.
          </p>
          <button className="bg-[#4B187C] hover:bg-[#3E1367] text-white font-semibold text-base px-8 py-3 rounded-full transition-colors shadow-md">
            Dar Feedback
          </button>
        </div>
        </section>
      )}

      
    </div>
  );
};

export default Home;