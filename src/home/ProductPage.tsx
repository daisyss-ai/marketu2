'use client';

import Link from "next/link";
import Image from 'next/image';
import { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import Header from '../components/layout/Header';
import ContactSellerButton from '@/components/produtos/ContactSellerButton'
import CategoriesNav from '../components/layout/CategoriesNav';
import InterestButton from '@/components/produtos/InterestButton';
import type { ProductDetail } from '@/lib/products/getProductDetail';
import { cn } from '@/lib/utils';

interface ProductPageProps {
  product: ProductDetail;
  currentUserId: string | null;
}

const placeholderImage = 'https://via.placeholder.com/640x480?text=Produto';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatProductType(type: ProductDetail['type']): string {
  if (type === 'digital_material') return 'Material digital';
  if (type === 'physical_product') return 'Produto fisico';
  return 'Servico';
}

function formatCreatedAt(value: string | null): string {
  if (!value) return 'Recentemente';
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

/*
function ProductSection({ title, products }: { title: string; products: ProductCardItem[] }) {
  if (products.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 pb-12 pt-6">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onToggleFavorite={() => {}}
            isFavorited={false}
          />
        ))}
      </div>
    </section>
  );
}
*/

export default function ProductPage({ product, currentUserId }: ProductPageProps) {
  const galleryImages =
    product.images.length > 0 ? product.images : [product.previewImage ?? placeholderImage];
  const [activeImage, setActiveImage] = useState(galleryImages[0] ?? placeholderImage);
  /*
  const [relatedProducts, setRelatedProducts] = useState<ProductCardItem[]>([]);
  const [sellerProducts, setSellerProducts] = useState<ProductCardItem[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      const supabase = createClient();
      const { data: productRow } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', product.id)
        .maybeSingle();

      if (!productRow?.category_id) return;

      const { data } = await supabase
        .from('products')
        .select('id, title, price, is_free, seller_id, categories(name), product_media(url, is_preview, position)')
        .eq('is_active', true)
        .eq('category_id', productRow.category_id)
        .neq('id', product.id)
        .limit(5);

      if (data) {
        setRelatedProducts(data.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price ?? 0),
          seller: 'MarketU',
          img: (p.product_media as any[])?.find((m: any) => m.is_preview)?.url
            || (p.product_media as any[])?.[0]?.url
            || null,
          category: (p.categories as any)?.name || 'Geral',
          statusColor: 'bg-green-400',
          rating: null,
          total_reviews: 0,
        })));
      }
    };
    fetchRelated();
  }, [product.id]);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, title, price, is_free, seller_id, categories(name), product_media(url, is_preview, position)')
        .eq('is_active', true)
        .eq('seller_id', product.sellerId)
        .neq('id', product.id)
        .limit(5);

      if (data) {
        setSellerProducts(data.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price ?? 0),
          seller: 'MarketU',
          img: (p.product_media as any[])?.find((m: any) => m.is_preview)?.url
            || (p.product_media as any[])?.[0]?.url
            || null,
          category: (p.categories as any)?.name || 'Geral',
          statusColor: 'bg-green-400',
          rating: null,
          total_reviews: 0,
        })));
      }
    };
    fetchSellerProducts();
  }, [product.sellerId]);
  */

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CategoriesNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 text-xs text-gray-500">
          Marketplace / Produto / <span className="font-medium text-gray-700">{product.title}</span>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="group flex items-center justify-center overflow-hidden rounded-2xl bg-white p-4 shadow-md">
              <Image
                src={activeImage}
                alt={product.title}
                width={640}
                height={480}
                className="h-auto w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((src, index) => {
                const isActive = src === activeImage;
                return (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    onClick={() => setActiveImage(src)}
                    className={cn(
                      'h-20 overflow-hidden rounded-xl border-2 bg-white transition-colors hover:border-[#4B187C]',
                      isActive ? 'border-[#4B187C]' : 'border-gray-200'
                    )}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} ${index + 1}`}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase text-[#4B187C]">
                {formatProductType(product.type)}
              </span>
              <button
                aria-label="Favoritar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div>
              <div className="mb-1 flex items-baseline gap-2">
                <div className="text-3xl font-extrabold text-[#4B187C]">
                  {formatCurrency(product.price)}
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">{product.title}</h1>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-0.5 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-gray-800">{product.rating?.toFixed(1) ?? 'Novo'}</span>
                <span>({product.totalReviews} avaliacoes)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-gray-900">Interesse na compra</div>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Manifesta interesse e o vendedor recebe um pedido para confirmar disponibilidade.
              </p>
              <InterestButton
                productId={product.id}
                sellerId={product.sellerId}
                currentUserId={currentUserId}
                className="mt-4"
              />
            </div>

            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Tipo</span>
                  <span className="text-right font-medium text-gray-900">
                    {formatProductType(product.type)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Preco</span>
                  <span className="text-right font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Publicado</span>
                  <span className="text-right font-medium text-gray-900">
                    {formatCreatedAt(product.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {product.sellerAvatarUrl ? (
                    <Image
                      src={product.sellerAvatarUrl}
                      alt={product.sellerName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-pink-200" />
                  )}
                  <div>
                    <Link
                      href={`/profile/user/${product.sellerId}`}
                      className="text-sm font-semibold text-gray-900 hover:underline"
                    >
                      {product.sellerName}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span>{product.rating?.toFixed(1) ?? 'Sem avaliacoes'} ({product.totalReviews})</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">Vendedor activo no MarketU</div>
              </div>
            </div>

           <ContactSellerButton
            productId={product.id}
            sellerId={product.sellerId}
            currentUserId={currentUserId}
              />
          </div>
        </div>
      </main>
     DEPOIS (temporário)
{/* <ProductSection title="Produtos Relacionados" products={relatedProducts} /> */}
{/* <ProductSection title="Mais deste Vendedor" products={sellerProducts} /> */}
{/* <Footer /> */}
    </div>
  );
}
