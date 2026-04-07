'use client';
import React, { useState } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (id: string | number) => void;
  isFavorited?: boolean;
}

const ProductCard = ({ product, onToggleFavorite = () => {}, isFavorited = false }: ProductCardProps) => {
  const [showToast, setShowToast] = useState(false);
  const isGreen = product.statusColor === 'bg-green-400';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onToggleFavorite(product.id);
    setShowToast(true);

    // Hide toast after 2 seconds
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <>
      <div className="group bg-surface rounded-2xl border border-muted/10 p-4 relative flex flex-col h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-within:ring-4 focus-within:ring-primary/10">
        {/* image + favorite */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-muted/5 aspect-[4/3]">
          <button
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur-sm border border-muted/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorited ? 'fill-error text-error scale-110' : 'text-muted hover:text-error'
              }`}
            />
          </button>

          <img
            src={product.img || '/assets/placeholder-product.png'}
            alt={product.title}
            className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* meta */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
          <Bookmark className="w-3 h-3 text-primary" />
          <span>{product.category}</span>
        </div>
        <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-black text-foreground tracking-tight">
            {typeof product.price === 'number' ? product.price.toLocaleString('pt-AO') : product.price}
          </span>
          <span className="text-[10px] font-black text-muted uppercase">kzs</span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-muted/5">
          <div className="flex items-center text-xs text-muted font-medium">
            <span
              className={`w-2.5 h-2.5 rounded-full mr-2 shadow-sm ${product.statusColor || 'bg-error'}`}
            />
            <span className="truncate max-w-[80px]">{product.seller || 'MarketU'}</span>
          </div>
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm ${
              isGreen ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            {isGreen ? 'Em stock' : 'Poucas unidades'}
          </span>
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-foreground text-surface px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
          {isFavorited ? (
            <>
              <span className="text-error">❤️</span> 
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
