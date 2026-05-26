'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createOrderAction } from '@/app/actions/orders';
import type { OrderStatus } from '@/lib/orders/getOrders';
import { cn } from '@/lib/utils';

type ExistingOrderLookup = {
  orderId: string;
  status: OrderStatus;
} | null;

type OrderItemRow = {
  order_id: string;
};

type ExistingOrderRow = {
  id: string;
  status: OrderStatus;
};

interface InterestButtonProps {
  productId: string;
  sellerId: string;
  currentUserId: string | null;
  className?: string;
}

async function getExistingOrderForProduct(
  buyerId: string,
  productId: string
): Promise<ExistingOrderLookup> {
  const supabase = createClient();

  const { data: matchingItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('product_id', productId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const orderIds = Array.from(
    new Set(((matchingItems ?? []) as OrderItemRow[]).map((item) => item.order_id).filter(Boolean))
  );

  if (orderIds.length === 0) {
    return null;
  }

  const { data: existingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('buyer_id', buyerId)
    .in('id', orderIds)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const existingOrder = ((existingOrders ?? []) as ExistingOrderRow[])[0];

  if (!existingOrder) {
    return null;
  }

  return {
    orderId: existingOrder.id,
    status: existingOrder.status,
  };
}

export default function InterestButton({
  productId,
  sellerId,
  currentUserId,
  className,
}: InterestButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lookupResult, setLookupResult] = useState<{
    lookupKey: string | null;
    existingOrder: ExistingOrderLookup;
    error: string | null;
  }>({
    lookupKey: null,
    existingOrder: null,
    error: null,
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const isSeller = currentUserId === sellerId;
  const lookupKey = currentUserId && !isSeller ? `${currentUserId}:${productId}` : null;
  const existingOrder =
    lookupKey && lookupResult.lookupKey === lookupKey ? lookupResult.existingOrder : null;
  const lookupError = lookupKey && lookupResult.lookupKey === lookupKey ? lookupResult.error : null;
  const isChecking = Boolean(lookupKey) && lookupResult.lookupKey !== lookupKey;

  useEffect(() => {
    let isMounted = true;

    if (!lookupKey || !currentUserId) {
      return () => {
        isMounted = false;
      };
    }

    void getExistingOrderForProduct(currentUserId, productId)
      .then((result) => {
        if (!isMounted) return;
        setLookupResult({ lookupKey, existingOrder: result, error: null });
      })
      .catch((lookupError) => {
        if (!isMounted) return;
        setLookupResult({
          lookupKey,
          existingOrder: null,
          error:
            lookupError instanceof Error
              ? lookupError.message
              : 'Nao foi possivel verificar o estado do pedido.',
        });
      })
    return () => {
      isMounted = false;
    };
  }, [currentUserId, lookupKey, productId]);

  const disabled = isChecking || isPending || Boolean(existingOrder);

  const buttonLabel = useMemo(() => {
    if (isChecking) return 'A verificar...';
    if (isPending) return 'A processar...';
    if (existingOrder) return 'Interesse manifestado';
    return 'Tenho interesse';
  }, [existingOrder, isChecking, isPending]);

  if (isSeller) {
    return null;
  }

  if (!currentUserId) {
    return (
      <div className={className}>
        <Link
          href="/login"
          className={cn(
            'inline-flex w-full items-center justify-center rounded-full bg-[#4B187C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3E1367]',
            className
          )}
        >
          Inicia sessao para manifestar interesse
        </Link>
      </div>
    );
  }

  const handleCreateOrder = () => {
    setSubmissionError(null);

    startTransition(async () => {
      const result = await createOrderAction(productId);

      if (!result.success) {
        setSubmissionError(result.error ?? 'Nao foi possivel criar o pedido.');
        return;
      }

      setLookupResult({
        lookupKey,
        existingOrder: { orderId: result.orderId ?? '', status: 'pending' },
        error: null,
      });
      router.push('/orders');
      router.refresh();
    });
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCreateOrder}
        disabled={disabled}
        className={cn(
          'inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all',
          disabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-500'
            : 'bg-[#4B187C] text-white shadow-sm hover:bg-[#3E1367]'
        )}
      >
        {(isChecking || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>
      {lookupError ? <p className="mt-2 text-sm text-red-500">{lookupError}</p> : null}
      {submissionError ? <p className="mt-2 text-sm text-red-500">{submissionError}</p> : null}
    </div>
  );
}
