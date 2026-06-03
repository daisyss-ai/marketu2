/**
 * @file Refactored ProductCard Component
 * @description Card de produto otimizado com memoization
 */

'use client';

import { SearchResult } from '@/types/search';
import { ReviewStats } from '@/components/reviews/ReviewStats';
import { Bookmark, MapPin } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

interface ProductCardProps {
  product: SearchResult;
}

/**
 * ProductCard memoizado para evitar rerenders
 * Apenas rerender se props mudarem
 */
const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group cursor-pointer transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100 h-40 md:h-44">
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Overlay badge */}
          {product.condition && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold">
              {product.condition === 'novo' ? '✨ Novo' : '📦 Usado'}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">
          <Bookmark className="w-3 h-3" />
          <span>{product.category}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
          {product.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-black text-foreground tracking-tight">
            {typeof product.price === 'number'
              ? product.price.toLocaleString('pt-AO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : product.price}
          </span>
          <span className="text-[10px] font-black text-muted uppercase">kzs</span>
        </div>

        {/* Meta: Location & Rating */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-muted/5">
          <div className="flex items-center text-xs text-muted font-medium gap-1">
            <MapPin className="w-3 h-3" />
            <span>{product.location}</span>
          </div>

          {product.reviewCount > 0 ? (
            <ReviewStats
              size="sm"
              stats={{
                average: product.rating,
                total: product.reviewCount,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              }}
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: apenas rerender se product.id ou key mudarem
  return prevProps.product.id === nextProps.product.id;
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
