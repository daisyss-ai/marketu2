'use client';
import { Bookmark, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import type { ProductCardItem } from '../../types';

interface ProductCardProps {
  product: ProductCardItem;
  onToggleFavorite?: (id: string | number) => void;
  isFavorited?: boolean;
}

const ProductCard = ({ product, onToggleFavorite = () => {}, isFavorited = false }: ProductCardProps) => {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const isGreen = product.statusColor === 'bg-green-400';

  const handleFavoriteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onToggleFavorite(product.id);
    setShowToast(true);

    // Hide toast after 2 seconds
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
        {/* Image area - edge to edge */}
        <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
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

          <img
            src={product.img || '/assets/placeholder-product.png'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category row */}
          <div className="flex items-center gap-1.5 mb-2">
            <Bookmark className="w-3 h-3 text-[#4B187C]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2 hover:text-[#4B187C] transition-colors">
            {product.title}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl font-black text-gray-900">
              {typeof product.price === 'number' ? product.price.toLocaleString('pt-AO') : product.price}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase">KZS</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mt-3 pt-3" />

          {/* Footer row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isGreen ? 'bg-green-400' : 'bg-orange-400'
                }`}
              />
              <span className="text-xs text-gray-500 font-medium truncate max-w-[80px]">
                {product.seller || 'MarketU'}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                isGreen ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'
              }`}
            >
              {isGreen ? 'Em stock' : 'Poucas unidades'}
            </span>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
          {isFavorited ? (
            <>
              <span>❤️</span> 
              Adicionado aos favoritos!
            </>
          ) : (
            <>
              <span>💔</span> 
              Removido dos favoritos
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductCard;
