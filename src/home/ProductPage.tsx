'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import { Heart, Star, Loader, ArrowLeft } from 'lucide-react';
import { productsAPI } from '../services/api';

interface ProductPageProps {
  productId?: string;
}

const ProductPage = ({ productId }: ProductPageProps) => {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsAPI.getProduct(productId);
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Não foi possível carregar o produto');
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
        <main className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg font-medium mb-2">
              ⚠️ {error || 'Produto não encontrado'}
            </p>
            <button
              onClick={() => router.push('/home')}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Voltar para Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const galleryImages = product.image_urls || ['/assets/placeholder-product.png'];
  const rating = product.rating || 4.5;
  const reviewCount = product.review_count || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-gray-500 mb-4 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* left: gallery */}
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-center overflow-hidden group">
              <img
                src={galleryImages[activeImage] || '/assets/placeholder-product.png'}
                alt={product.title}
                className="w-full h-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 max-h-96"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryImages.map((src: string, idx: number) => {
                  const isActive = idx === activeImage;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`h-20 rounded-xl border-2 bg-white overflow-hidden hover:border-[#4B187C] transition-colors ${
                        isActive ? 'border-[#4B187C]' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* right: details */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-purple-100 text-[#4B187C] px-3 py-1 text-xs font-semibold uppercase">
                {product.category}
              </span>
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                aria-label="Favoritar"
                className={`w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-colors ${
                  isFavorited
                    ? 'text-red-500 border-red-300'
                    : 'text-gray-500 hover:text-red-500 hover:border-red-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-3xl font-extrabold text-[#4B187C]">
                  {typeof product.price === 'number' ? product.price.toLocaleString('pt-AO') : product.price} Kz
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>

              {rating > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(rating) ? 'fill-current' : 'fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-gray-800">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && <span>({reviewCount} avaliações)</span>}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* meta cards */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoria</span>
                  <span className="font-medium text-gray-900">Material de Estudos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condição</span>
                  <span className="font-medium text-gray-900">Novo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publicado</span>
                  <span className="font-medium text-gray-900">Há 2 dias</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-200" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Stephane Quinana</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>4.8 (121)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">Membro desde 2025</div>
              </div>
            </div>

            <button className="w-full mt-2 bg-[#4B187C] hover:bg-[#3E1367] text-white py-3 rounded-full text-sm font-semibold shadow-md transition-colors">
              Contatar Vendedor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPage;

