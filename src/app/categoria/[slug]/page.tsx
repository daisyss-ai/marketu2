'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/produtos/ProductCard';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductCardItem {
  id: string;
  title: string;
  price: number;
  seller: string;
  img: string;
  category: string;
  statusColor: string;
  rating: number | null;
  total_reviews: number;
}

// Mapeamento slug → imagem hero da categoria
const CATEGORY_IMAGES: Record<string, string> = {
  bagagem: '/assets/categories/bagagem.png',
  comida: '/assets/categories/comida.png',
  decorativo: '/assets/categories/decorativo.png',
  desporto: '/assets/categories/desporto.png',
  'escolar-escritorio': '/assets/categories/escolarescritorio.png',
  'joalharia-relogios': '/assets/categories/joalhariarelogios.png',
  'lazer-hobbies': '/assets/categories/lazerhobbies.png',
  livros: '/assets/categories/livros.png',
  pet: '/assets/categories/pet.png',
  'roupas-calcados': '/assets/categories/roupascalcados.png',
  servicos: '/assets/categories/servicos.png',
  tecnologia: '/assets/categories/tecnologia.png',
  'saude-beleza': '/assets/categories/belezasaude.png',
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Busca a categoria pelo slug
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (!categoryData) {
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // Busca os produtos desta categoria
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          id, title, price, is_free, seller_id, rating, total_reviews,
          categories(name),
          product_media(url, is_preview, position)
        `)
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsData) {
        setProducts(
          productsData.map((p: any): ProductCardItem => ({
            id: String(p.id),
            title: String(p.title),
            price: Number(p.price ?? 0),
            seller: 'MarketU',
            img:
              (p.product_media as any[])?.find((m: any) => m.is_preview)?.url ||
              (p.product_media as any[])?.[0]?.url ||
              '',
            category:
              (Array.isArray(p.categories)
                ? p.categories[0]?.name
                : (p.categories as any)?.name) || categoryData.name,
            statusColor: 'bg-green-400',
            rating: typeof p.rating === 'number' ? p.rating : null,
            total_reviews: typeof p.total_reviews === 'number' ? p.total_reviews : 0,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [slug]);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const heroImage = CATEGORY_IMAGES[slug] || '/assets/hero-bg.png';

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* Hero da categoria */}
      <section
        className="relative w-full h-56 md:h-72 flex items-end overflow-hidden"
        style={{
          backgroundImage: `url('${heroImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A4A]/80 via-[#2C1A4A]/30 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-8">
          <p className="text-white/70 text-sm font-medium mb-1">Categoria</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            {category?.name ?? '...'}
          </h1>
        </div>
      </section>

      {/* Produtos */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-400 text-lg font-medium">
              Nenhum produto nesta categoria ainda.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Sê o primeiro a vender aqui!
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">
              {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorited={favorites.includes(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}