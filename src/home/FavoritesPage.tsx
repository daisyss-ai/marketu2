'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/produtos/ProductCard';
import type { SavedProduct } from '@/lib/saved/getSavedProducts';

interface FavoritesPageProps {
  savedProducts: SavedProduct[];
}

function toProductCardItem(p: SavedProduct) {
  return {
    id: p.productId,
    title: p.title,
    price: p.price,
    img: p.imageUrl ?? '',
    seller: p.sellerName ?? 'MarketU',
    category: '',
    statusColor: 'bg-green-400',
    rating: p.rating ?? 0,
    total_reviews: p.totalReviews ?? 0,
    userId: p.sellerId,
  };
}

export default function FavoritesPage({ savedProducts }: FavoritesPageProps) {
  const router = useRouter();
  const [items, setItems] = useState<SavedProduct[]>(savedProducts);

  useEffect(() => {
    // Quando qualquer FavoriteButton dispara o evento, remove o produto
    // do grid consultando o cache do Supabase client para saber quais
    // productIds ainda estão guardados — mais simples: fazemos router.refresh()
    // para re-fetch no servidor E removemos optimisticamente do estado local.
    const handle = async () => {
      // Importa o cliente só quando necessário (é client-side)
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', user.id);

      const savedIds = new Set((data ?? []).map((r: { product_id: string }) => r.product_id));

      setItems((prev) => prev.filter((item) => savedIds.has(item.productId)));
      router.refresh();
    };

    window.addEventListener('saved-products-changed', handle);
    return () => window.removeEventListener('saved-products-changed', handle);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-5 w-5 fill-red-400 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Os meus favoritos</h1>
            <p className="text-sm text-gray-500">
              {items.length} produto{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((product) => (
              <div
                key={product.productId}
                className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <ProductCard product={toProductCardItem(product)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
              <Heart className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Ainda não tens favoritos</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-xs">
              Guarda produtos que gostes para os encontrar mais facilmente.
            </p>
            <Link
              href="/home"
              className="mt-5 inline-flex rounded-full bg-[#4B187C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3a1260] transition-colors"
            >
              Explorar produtos
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}