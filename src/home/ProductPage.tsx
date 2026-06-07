'use client';

import { createClient } from '@/lib/supabase/client';
import type { ProductDetail } from '@/lib/products/getProductDetail';
import type { ProductCardItem } from '@/types';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import CategoriesNav from '../components/layout/CategoriesNav';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import ProductCard from '../components/produtos/ProductCard';

interface ProductPageProps {
  product: ProductDetail;
  currentUserId: string | null;
}

type ProductSectionRow = {
  id: string;
  title: string;
  price: number | string | null;
  is_free: boolean | null;
  seller_id: string;
  categories: { name: string | null } | { name: string | null }[] | null;
  product_media: Array<{ url: string | null; is_preview: boolean | null; position: number | null }> | null;
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Recentemente';

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

function getCategoryName(categories: ProductSectionRow['categories']): string {
  if (Array.isArray(categories)) {
    return categories[0]?.name || 'Geral';
  }

  return categories?.name || 'Geral';
}

function mapProductCardItem(product: ProductSectionRow): ProductCardItem {
  const media = [...(product.product_media || [])].sort(
    (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
  );

  return {
    id: product.id,
    title: product.title,
    price: Number(product.price ?? 0),
    seller: 'MarketU',
    img: media.find((item) => item.is_preview)?.url || media[0]?.url || '',
    category: getCategoryName(product.categories),
    statusColor: 'bg-green-400',
  };
}

function ProductSection({ title, products }: { title: string; products: ProductCardItem[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pb-12 pt-6">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onToggleFavorite={() => {}}
            isFavorited={false}
          />
        ))}
      </div>
    </section>
  );
}

const ProductPage = ({ product, currentUserId }: ProductPageProps) => {
  const [activeImage, setActiveImage] = useState<string>(product.previewImage || product.images[0] || '');
  const [categoryName, setCategoryName] = useState('Geral');
  const [relatedProducts, setRelatedProducts] = useState<ProductCardItem[]>([]);
  const [sellerProducts, setSellerProducts] = useState<ProductCardItem[]>([]);

  useEffect(() => {
    setActiveImage(product.previewImage || product.images[0] || '');
  }, [product.id, product.previewImage, product.images]);

  useEffect(() => {
    let isCancelled = false;

    const fetchRelatedProducts = async () => {
      const supabase = createClient();
      const { data: productCategory, error: categoryError } = await supabase
        .from('products')
        .select('category_id, categories(name)')
        .eq('id', product.id)
        .maybeSingle();

      if (categoryError) {
        console.error('Erro ao buscar categoria do produto:', categoryError);
      }

      const categoryId = productCategory?.category_id;
      const currentCategoryName = getCategoryName((productCategory as any)?.categories ?? null);

      if (!isCancelled) {
        setCategoryName(currentCategoryName);
      }

      if (!categoryId) {
        if (!isCancelled) setRelatedProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, is_free, seller_id, categories(name), product_media(url, is_preview, position)')
        .eq('is_active', true)
        .neq('id', product.id)
        .eq('category_id', categoryId)
        .limit(5);

      if (error) {
        console.error('Erro ao buscar produtos relacionados:', error);
      }

      if (!isCancelled) {
        setRelatedProducts(((data || []) as ProductSectionRow[]).map(mapProductCardItem));
      }
    };

    fetchRelatedProducts();

    return () => {
      isCancelled = true;
    };
  }, [product.id]);

  useEffect(() => {
    let isCancelled = false;

    const fetchSellerProducts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, is_free, seller_id, categories(name), product_media(url, is_preview, position)')
        .eq('is_active', true)
        .neq('id', product.id)
        .eq('seller_id', product.sellerId)
        .limit(5);

      if (error) {
        console.error('Erro ao buscar produtos do vendedor:', error);
      }

      if (!isCancelled) {
        setSellerProducts(((data || []) as ProductSectionRow[]).map(mapProductCardItem));
      }
    };

    fetchSellerProducts();

    return () => {
      isCancelled = true;
    };
  }, [product.id, product.sellerId]);

  const images = product.images.length > 0 ? product.images : product.previewImage ? [product.previewImage] : [];
  const isFree = product.price === 0;
  const sellerYear = product.createdAt ? new Date(product.createdAt).getFullYear() : null;
  const hasCurrentUser = Boolean(currentUserId);
  const stockStatus = { text: 'Em stock', color: 'text-green-600' };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <CategoriesNav />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-3">
          {categoryName} /{' '}
          <span className="text-gray-700 font-medium">{product.title}</span>
        </div>

        {/* Main grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: image */}
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-[560px]">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full max-h-[620px] object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-12 h-12 mb-2" />
                  <span className="text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image) => (
                  <button
                    key={image}
                    onClick={() => setActiveImage(image)}
                    className={`h-16 rounded-xl border-2 bg-white overflow-hidden hover:border-[#4B187C] transition-colors ${
                      activeImage === image
                        ? 'border-[#4B187C]'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt="Miniatura"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="flex flex-col gap-3">
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
                {isFree ? 'Gratuito' : `${product.price.toLocaleString('pt-AO')} Kz`}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Stock badge */}
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full w-fit ${stockStatus.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
              {stockStatus.text}
            </div>

            {/* Meta card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 text-sm">
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
                  {timeAgo(product.createdAt)}
                </span>
              </div>
            </div>

            {/* Seller card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
              {product.sellerAvatarUrl ? (
                <img
                  src={product.sellerAvatarUrl}
                  alt={product.sellerName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold flex-shrink-0">
                  {product.sellerName[0]?.toUpperCase() || 'V'}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {product.sellerName}
                </div>
                <div className="text-xs text-gray-500">
                  Membro desde {sellerYear || '2025'}
                </div>
              </div>
            </div>

            {/* CTA button */}
            <button
              data-authenticated={hasCurrentUser}
              className="w-full bg-[#4B187C] hover:bg-[#3E1367] text-white py-3 rounded-full text-sm font-semibold shadow-md transition-colors mt-auto"
            >
              Contatar Vendedor
            </button>
          </div>
        </div>
      </main>

      <ProductSection title="Produtos Relacionados" products={relatedProducts} />
      <ProductSection title="Mais deste Vendedor" products={sellerProducts} />
      <Footer />
    </div>
  );
};

export default ProductPage;
