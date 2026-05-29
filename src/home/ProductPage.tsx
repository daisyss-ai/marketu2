'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '../components/layout/Header';
import { Heart, Star, Package, Loader } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number | null;
  is_free: boolean;
  type: 'physical_product' | 'digital_material' | 'service';
  created_at: string;
  categories: { name: string } | null;
  product_media: Array<{ url: string; is_preview: boolean; position: number }>;
  product_stock: { quantity: number } | null;
  users: { id: string; full_name: string; username: string; avatar_url: string | null; created_at: string } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Há 1 dia';
  if (days < 30) return `Há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Há 1 mês';
  return `Há ${months} meses`;
}

function getProductTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    physical_product: 'Físico',
    digital_material: 'Digital',
    service: 'Serviço',
  };
  return typeMap[type] || 'Físico';
}

const ProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          title,
          description,
          price,
          is_free,
          type,
          created_at,
          categories(name),
          product_media(url, is_preview, position),
          product_stock(quantity),
          users!seller_id(id, full_name, username, avatar_url, created_at)
        `
        )
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar produto:', error);
      }

      if (data) {
        setProduct(data as unknown as Product);
        const images = (data.product_media as Array<any>) || [];
        const sortedImages = images.sort((a, b) => (a.position || 0) - (b.position || 0));
        const mainImage = sortedImages.find((m) => m.is_preview) || sortedImages[0];
        setActiveImage(mainImage?.url || '');
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 text-[#4B187C] animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Carregando produto...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
            <p className="text-gray-500 mb-6">Este produto não está disponível ou foi removido.</p>
            <button
              onClick={() => router.push('/home')}
              className="bg-[#4B187C] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#3E1367] transition-colors"
            >
              Voltar para Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const images = (product.product_media || []).sort((a, b) => (a.position || 0) - (b.position || 0));
  const quantity = product.product_stock?.quantity ?? 0;
  const seller = product.users;
  const sellerName = seller?.username || seller?.full_name || 'Vendedor';
  const categoryName = product.categories?.name || 'Geral';
  const sellerYear = new Date(seller?.created_at || '').getFullYear();

  let stockStatus = { text: 'Em stock', color: 'text-green-600' };
  if (quantity === 0) {
    stockStatus = { text: 'Esgotado', color: 'text-red-600' };
  } else if (quantity <= 3) {
    stockStatus = { text: `Apenas ${quantity} itens em stock`, color: 'text-orange-500' };
  }

  const priceDisplay = product.is_free ? 'Gratuito' : `${product.price?.toLocaleString('pt-AO')} Kz`;

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          {categoryName} /{' '}
          <span className="text-gray-700 font-medium">{product.title}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* left: gallery */}
          <div>
            {images.length > 0 ? (
              <>
                <div className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-center overflow-hidden group">
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="w-full h-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {images.map((src) => {
                      const isActive = src.url === activeImage;
                      return (
                        <button
                          type="button"
                          key={src.url}
                          onClick={() => setActiveImage(src.url)}
                          className={`h-20 rounded-xl border-2 bg-white overflow-hidden hover:border-[#4B187C] transition-colors ${
                            isActive ? 'border-[#4B187C]' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={src.url}
                            alt="Miniatura"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-4 shadow-md flex items-center justify-center h-80">
                <div className="text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma imagem disponível</p>
                </div>
              </div>
            )}
          </div>

          {/* right: details */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-purple-100 text-[#4B187C] px-3 py-1 text-xs font-semibold uppercase">
                {categoryName}
              </span>
              <button
                aria-label="Favoritar"
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-[#4B187C] mb-1">{priceDisplay}</div>
              <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

            {/* stock status */}
            <div>
              <p className={`text-xs font-semibold ${stockStatus.color}`}>
                {stockStatus.text}
              </p>
            </div>

            {/* meta cards */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoria</span>
                  <span className="font-medium text-gray-900">{categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condição</span>
                  <span className="font-medium text-gray-900">{getProductTypeLabel(product.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publicado</span>
                  <span className="font-medium text-gray-900">{timeAgo(product.created_at)}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  {seller?.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={sellerName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] font-bold flex items-center justify-center">
                      {sellerName[0]?.toUpperCase() || 'V'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{sellerName}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>4.8 (121)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">Membro desde {sellerYear}</div>
              </div>
            </div>

            {/* CTA button */}
            <button className="w-full bg-[#4B187C] hover:bg-[#3E1367] text-white py-3 rounded-full text-sm font-semibold shadow-md transition-colors">
              Contatar Vendedor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductPage;
