'use client';
import { createClient } from '@/lib/supabase/client';
import { Loader, Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';

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
          seller_id,
          categories(name, slug),
          product_media(url, is_preview, position),
          product_stock(quantity)
        `
        )
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar produto:', JSON.stringify(error, null, 2));
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
      <main className="flex-1 overflow-hidden max-w-6xl w-full mx-auto px-6 py-4 flex flex-col">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-3">
          {categoryName} /{' '}
          <span className="text-gray-700 font-medium">{product.title}</span>
        </div>

        {/* Main grid */}
        <div className="grid md:grid-cols-2 gap-8 flex-1 min-h-0">
          
          {/* Left: image */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden flex-1 min-h-0">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-12 h-12 mb-2" />
                  <span className="text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                {images.map((media) => (
                  <button
                    key={media.url}
                    onClick={() => setActiveImage(media.url)}
                    className={`h-16 rounded-xl border-2 bg-white overflow-hidden hover:border-[#4B187C] transition-colors ${
                      activeImage === media.url 
                        ? 'border-[#4B187C]' 
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={media.url}
                      alt="Miniatura"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            
            {/* Category badge */}
            <span className="inline-flex items-center rounded-full bg-purple-100 text-[#4B187C] px-3 py-1 text-xs font-semibold uppercase w-fit">
              {categoryName}
            </span>

            {/* Title and price */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {product.title}
              </h1>
              <div className="text-2xl font-extrabold text-[#4B187C]">
                {product.is_free 
                  ? 'Gratuito' 
                  : `${(product.price ?? 0).toLocaleString('pt-AO')} Kz`}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Stock badge */}
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full w-fit ${stockStatus.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
              {stockStatus.text}
            </div>

            {/* Meta card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 text-sm flex-shrink-0">
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium text-gray-900">
                  {getProductTypeLabel(product.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Condição</span>
                <span className="font-medium text-gray-900">
                  {getProductTypeLabel(product.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Publicado</span>
                <span className="font-medium text-gray-900">
                  {timeAgo(product.created_at)}
                </span>
              </div>
            </div>

            {/* Seller card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3 flex-shrink-0">
              {seller?.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller?.username || seller?.full_name || 'Vendedor'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold flex-shrink-0">
                  {(seller?.username || seller?.full_name || 'V')
                    ?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {seller?.username || seller?.full_name || 'Vendedor'}
                </div>
                <div className="text-xs text-gray-500">
                  Membro desde {seller?.created_at 
                    ? new Date(seller.created_at).getFullYear() 
                    : '2025'}
                </div>
              </div>
            </div>

            {/* CTA button */}
            <button className="w-full bg-[#4B187C] hover:bg-[#3E1367] text-white py-3 rounded-full text-sm font-semibold shadow-md transition-colors flex-shrink-0 mt-auto">
              Contatar Vendedor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductPage;
