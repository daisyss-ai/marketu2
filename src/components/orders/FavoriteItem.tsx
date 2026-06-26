'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Package2, Heart } from 'lucide-react';
import type { SavedProduct } from '@/lib/saved/getSavedProducts';
import { cn } from '@/lib/utils';

interface FavoriteItemProps {
  product: SavedProduct;
  isRemovePending: boolean;
  error: string | null;
  onRemove: (product: SavedProduct) => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function FavoriteItem({
  product,
  isRemovePending,
  error,
  onRemove,
}: FavoriteItemProps) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

        {/* Imagem */}
        <Link
          href={`/product/${product.productId}`}
          className="block h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-50"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package2 className="h-8 w-8" />
            </div>
          )}
        </Link>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Link
                href={`/product/${product.productId}`}
                className="block truncate text-base font-semibold text-gray-900 transition-colors hover:text-[#4B187C] md:text-lg"
              >
                {product.title}
              </Link>
              <p className="mt-1 text-sm text-gray-500">{product.sellerName}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatCurrency(product.price)}
              </p>
              {product.rating ? (
                <p className="mt-1 text-sm text-gray-400">{product.rating.toFixed(1)} / 5 ★</p>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sem avaliações ainda</p>
              )}
            </div>

            <p className="text-xs text-gray-400 md:text-right shrink-0">
              Guardado em{' '}
              {new Intl.DateTimeFormat('pt-PT').format(new Date(product.savedAt))}
            </p>
          </div>

          {/* Ações */}
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/product/${product.productId}`}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-[#4B187C] text-white hover:opacity-90 transition-opacity"
              >
                Ver produto
              </Link>

              <button
                type="button"
                onClick={() => onRemove(product)}
                disabled={isRemovePending}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  isRemovePending
                    ? 'border-gray-200 text-gray-400'
                    : 'border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                )}
              >
                {isRemovePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A remover...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                    Remover
                  </>
                )}
              </button>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>
        </div>
      </div>
    </article>
  );
}