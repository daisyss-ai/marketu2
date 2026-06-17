'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, Package2 } from 'lucide-react';
import { checkActiveOrderAction } from '@/app/actions/orders';
{/* import { createOrderAction } from '@/app/actions/orders'; 
import { unsaveProductAction } from '@/app/actions/saved';  */}
import type { SavedProduct } from '@/lib/saved/getSavedProducts';
import { cn } from '@/lib/utils';

interface CartItemProps {
  product: SavedProduct;
  isInterestPending: boolean;
  isRemovePending: boolean;
  isActionPending: boolean;
  error: string | null;
  onInterest: (product: SavedProduct) => void;
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

export default function CartItem({
  product,
  isInterestPending,
  isRemovePending,
  isActionPending,
  error,
  onInterest,
  onRemove,
}: CartItemProps) {
  const busy = isActionPending || isInterestPending || isRemovePending;
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [isCheckingOrder, setIsCheckingOrder] = useState(true);

  useEffect(() => {
    const checkOrder = async () => {
      setIsCheckingOrder(true);
      const result = await checkActiveOrderAction(product.productId);
      setHasActiveOrder(result.hasActiveOrder);
      setIsCheckingOrder(false);
    };

    checkOrder();
  }, [product.productId]);

  const isInterestDisabled = isCheckingOrder || hasActiveOrder || busy;
  const interestButtonText = isCheckingOrder
    ? 'A verificar...'
    : hasActiveOrder
      ? 'Interesse já manifestado'
      : 'Tenho interesse';

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Link
                href={`/product/${product.productId}`}
                className="block truncate text-base font-semibold text-gray-900 transition-colors hover:text-gray-700 md:text-lg"
              >
                {product.title}
              </Link>
              <p className="mt-1 text-sm text-gray-500">{product.sellerName}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatCurrency(product.price)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {product.rating ? `${product.rating.toFixed(1)} / 5` : 'Sem avaliacoes ainda'}
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <p className="text-sm text-gray-500">
                Adicionado em {new Intl.DateTimeFormat('pt-PT').format(new Date(product.savedAt))}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onInterest(product)}
                disabled={isInterestDisabled}
                className={cn(
                  'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  isInterestDisabled && !isCheckingOrder
                    ? 'bg-gray-100 text-gray-500'
                    : isInterestPending || isCheckingOrder
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-primary text-white hover:opacity-90'
                )}
              >
                {isInterestPending || isCheckingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCheckingOrder ? 'A verificar...' : 'A criar pedido...'}
                  </>
                ) : (
                  interestButtonText
                )}
              </button>

              <button
                type="button"
                onClick={() => onRemove(product)}
                disabled={busy}
                className={cn(
                  'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  isRemovePending
                    ? 'border-gray-200 text-gray-400'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {isRemovePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A remover...
                  </>
                ) : (
                  'Remover'
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
