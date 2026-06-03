'use client';

import { Bookmark, Heart } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import type { ProductCardItem } from '../../types';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: ProductCardItem;
  onToggleFavorite?: (id: string | number) => void;
  isFavorited?: boolean;
}

const ProductCard = ({ product, onToggleFavorite = () => {}, isFavorited = false }: ProductCardProps) => {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const isGreen = product.statusColor === 'bg-green-400';
  const ratingValue = typeof product.rating === 'number' ? product.rating : 0;
  const totalReviews =
    typeof product.total_reviews === 'number'
      ? product.total_reviews
      : typeof product.reviewCount === 'number'
        ? product.reviewCount
        : typeof product.reviews === 'number'
          ? product.reviews
          : 0;

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(product.id);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
      >
        {/* Image area */}
        <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
          <AddToCartButton
            productId={String(product.id)}
            sellerId={typeof product.userId === 'string' ? product.userId : null}
            className="absolute top-3 left-3 z-10"
          />
          <button
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>
          <Image
            src={product.img || '/assets/placeholder-product.png'}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Bookmark className="w-3 h-3 text-[#4B187C]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {product.category}
            </span>
          </div>

          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2 hover:text-[#4B187C] transition-colors">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl font-black text-gray-900">
              {typeof product.price === 'number' ? product.price.toLocaleString('pt-AO') : product.price}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase">KZS</span>
          </div>

          {totalReviews > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(ratingValue))}</span>
              <span className="text-xs text-gray-400">({totalReviews})</span>
            </div>
          )}

          <div className="border-t border-gray-100 mt-auto pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isGreen ? 'bg-green-400' : 'bg-orange-400'}`} />
              <span className="text-xs text-gray-500 font-medium truncate max-w-[80px]">
                {product.seller || 'MarketU'}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isGreen ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
              {isGreen ? 'Em stock' : 'Poucas unidades'}
            </span>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 flex items-center gap-3">
          {isFavorited ? '✓ Adicionado aos favoritos!' : '💔 Removido dos favoritos'}
        </div>
      )}
    </>
  );
};

export default ProductCard;