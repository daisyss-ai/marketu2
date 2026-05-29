'use client';
import { Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { createClient } from '../lib/supabase/client';

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  is_free: boolean | null;
  type: string;
  created_at: string;
  seller_id: string;
  seller: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  categories: { name: string; slug: string } | null;
  product_media: Array<{ url: string; is_preview: boolean | null; position: number | null }>;
  product_stock: Array<{ quantity: number | null }>;
}

// Helper to format date as relative time
function formatRelativeDate(date: string): string {
  const createdDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Há 1 dia';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
  return `Há ${Math.floor(diffDays / 365)} anos`;
}

// Helper to format date as year only
function getYear(date: string): number {
  return new Date(date).getFullYear();
}

// Helper to map product type
function getProductTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    physical_product: 'Físico',
    digital_material: 'Digital',
    service: 'Serviço',
  };
  return typeMap[type] || type;
}

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <div className="w-full aspect-[4/3] bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-full w-1/3" />
        <div className="h-10 bg-gray-200 rounded-lg w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-32 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const ProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError('Produto não encontrado');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const supabase = createClient();
        
        // Step 1: Fetch the product with seller_id only
        const { data, error: dbError } = await supabase
          .from('products')
          .select(`
            id, title, description, price, is_free, type, created_at, seller_id,
            categories(name, slug),
            product_media(url, is_preview, position),
            product_stock(quantity)
          `)
          .eq('id', productId)
          .maybeSingle();

        if (dbError || !data) {
          setError('Produto não encontrado');
          setLoading(false);
          return;
        }

        // Step 2: Fetch seller data from users table using seller_id directly
        const { data: sellerData } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, created_at')
          .eq('id', data.seller_id)
          .maybeSingle();

        // Step 3: Combine and set state
        setProduct({ ...data, seller: sellerData } as unknown as ProductDetail);
        
        // Set the first preview image or first image as active
        const sortedMedia = (data.product_media || []).sort(
          (a, b) => ((a.position ?? 0) - (b.position ?? 0))
        );
        const previewImage =
          sortedMedia.find((m) => m.is_preview)?.url || sortedMedia[0]?.url;
        setActiveImage(previewImage || null);
      } catch (err) {
        setError('Erro ao carregar produto');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Produto não encontrado</h1>
            <p className="text-gray-600 mb-6">Este produto não está disponível ou foi removido.</p>
            <button
              onClick={() => router.push('/home')}
              className="bg-[#4B187C] hover:bg-[#3E1367] text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
            >
              Voltar para Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const sortedMedia = (product.product_media || []).sort(
    (a, b) => ((a.position ?? 0) - (b.position ?? 0))
  );
  const stock = product.product_stock?.[0]?.quantity ?? 0;
  const seller = product.seller ?? null;
  const categoryName = product.categories?.name || 'Sem categoria';

  let stockStatus = '';
  let stockBadgeClass = '';
  if (stock === 0) {
    stockStatus = 'Esgotado';
    stockBadgeClass = 'bg-red-50 text-red-600';
  } else if (stock <= 3) {
    stockStatus = `Apenas ${stock} itens em stock`;
    stockBadgeClass = 'bg-orange-50 text-orange-500';
  } else {
    stockStatus = 'Em stock';
    stockBadgeClass = 'bg-green-50 text-green-600';
  }

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

            {sortedMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                {sortedMedia.map((media) => (
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
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full w-fit ${stockBadgeClass}`}>
              {stockStatus}
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
                  {formatRelativeDate(product.created_at)}
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
