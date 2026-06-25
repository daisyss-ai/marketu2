'use client';

import { Heart } from 'lucide-react';
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
        className="group overflow-hidden cursor-pointer flex flex-col h-full hover:shadow-lg transition-shadow duration-300"
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
            src={product.img || '/assets/placeholder-product.svg'}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            unoptimized={!!product.img}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 hover:text-[#4B187C] transition-colors">
            {product.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-2">
            por {product.seller || 'MarketU'}
          </p>

          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-gray-900">
              {typeof product.price === 'number' ? product.price.toLocaleString('pt-AO') : product.price}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase">KZS</span>
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