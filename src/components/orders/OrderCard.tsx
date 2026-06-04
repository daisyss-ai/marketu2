'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Package2, Star } from 'lucide-react';
import { updateOrderStatusAction } from '@/app/actions/orders';
import { BuyerReviewForm } from '@/components/reviews/BuyerReviewForm';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import type {
  Order,
  OrderMode,
  OrderProductType,
  OrderStatus,
} from '@/lib/orders/getOrders';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  currentUserId: string;
  mode: OrderMode;
  onStatusUpdated: (mode: OrderMode, orderId: string, status: OrderStatus) => void;
}

const productTypeLabels: Record<OrderProductType, string> = {
  digital_material: 'Material digital',
  service: 'Serviço',
  physical_product: 'Produto físico',
};

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  maximumFractionDigits: 2,
});

const BADGE_LABELS: Record<string, string> = {
  paid_fast: '⚡ Pagou rapidamente',
  good_communication: '💬 Boa comunicação',
  punctual: '⏰ Pontual',
  polite: '😊 Educado',
  trustworthy: '🤝 Lento a responder',
  no_show: '👻 Não apareceu',
  bad_communication: '🔵 Difícil contactar',
  late: '⌛ Chegou atrasado',
};

function BuyerReputationBadge({ reputation }: { reputation: { avgRating: number; total: number; topBadges: string[] } }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        <span>{reputation.avgRating.toFixed(1)}</span>
        <span className="text-gray-400">· {reputation.total} {reputation.total === 1 ? 'avaliação' : 'avaliações'}</span>
      </div>
      {reputation.topBadges.map((badge) => (
        <span key={badge} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
          {BADGE_LABELS[badge] ?? badge}
        </span>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getVisibleActions(mode: OrderMode, status: OrderStatus): OrderStatus[] {
  if (mode === 'buyer') {
    return status === 'pending' ? ['cancelled'] : [];
  }
  if (status === 'pending') return ['confirmed', 'cancelled'];
  if (status === 'confirmed') return ['delivered'];
  return [];
}

function getActionLabel(status: OrderStatus): string {
  if (status === 'confirmed') return 'Confirmar disponibilidade';
  if (status === 'delivered') return 'Marcar como entregue';
  return 'Cancelar';
}

function getActionClassName(status: OrderStatus): string {
  if (status === 'confirmed') return 'border-blue-200 text-blue-600 hover:bg-blue-50';
  if (status === 'delivered') return 'border-green-200 text-green-600 hover:bg-green-50';
  return 'border-red-200 text-red-600 hover:bg-red-50';
}

export default function OrderCard({
  order,
  currentUserId: _currentUserId,
  mode,
  onStatusUpdated,
}: OrderCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const firstItem = order.items[0];
  const counterpartyName =
    mode === 'buyer'
      ? order.seller?.fullName || 'Vendedor MarketU'
      : order.buyer?.fullName || 'Comprador MarketU';
  const availableActions = getVisibleActions(mode, order.status);

  if (!firstItem) return null;

  const handleStatusAction = (nextStatus: OrderStatus) => {
    startTransition(async () => {
      setActionError(null);
      const result = await updateOrderStatusAction(order.id, nextStatus);
      if (!result.success) {
        setActionError(result.error || 'Não foi possível actualizar o pedido.');
        return;
      }
      onStatusUpdated(mode, order.id, nextStatus);
      router.refresh();
    });
  };

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-50">
          {firstItem.imageUrl ? (
            <Image
              src={firstItem.imageUrl}
              alt={firstItem.productTitle}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package2 className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 md:text-lg">
                {firstItem.productTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{counterpartyName}</p>
              {mode === 'seller' && order.status === 'pending' && order.buyerReputation ? (
                <BuyerReputationBadge reputation={order.buyerReputation} />
              ) : null}
              <p className="mt-1 text-sm text-gray-500">
                Quantidade: {firstItem.quantity} - {formatCurrency(firstItem.unitPrice)}
              </p>
              {order.pickupLocation ? (
                <p className="mt-1 text-sm text-gray-500">
                  Levantamento: <span className="text-gray-700">{order.pickupLocation}</span>
                </p>
              ) : null}
              {order.notes ? (
                <p className="mt-1 text-sm text-gray-500">
                  Notas: <span className="text-gray-700">{order.notes}</span>
                </p>
              ) : null}
              {order.items.length > 1 ? (
                <p className="mt-1 text-sm text-gray-500">
                  +{order.items.length - 1} item{order.items.length === 2 ? '' : 's'} neste pedido
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-gray-500">
                  {dateFormatter.format(new Date(order.createdAt))}
                </span>
              </div>
              <p className="text-sm text-gray-500">{productTypeLabels[firstItem.productType]}</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.items.reduce((sum, item) => sum + item.totalPrice, 0))}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/product/${firstItem.productId}`}
              className="inline-flex items-center text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              Ver produto
            </Link>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                 {mode === 'buyer' && order.status === 'delivered' ? (
                  order.hasReviewedProduct ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      ✅ Produto avaliado
                    </span>
                  ) : (
                    <Link
                      href={`/product/${firstItem.productId}#write-review`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      ⭐ Avaliar produto
                    </Link>
                  )
                ) : null}

                {availableActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusAction(action)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                      getActionClassName(action)
                    )}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {getActionLabel(action)}
                  </button>
                ))}
              </div>

            {actionError ? (
                <p className="text-sm text-red-600">{actionError}</p>
              ) : null}
            </div>
          </div>

          {mode === 'seller' && order.status === 'delivered' ? (
            order.hasReviewedBuyer ? (
              <p className="mt-4 text-xs text-emerald-600 font-medium">✅ Comprador já avaliado</p>
            ) : (
              <BuyerReviewForm
                orderId={order.id}
                buyerId={order.buyerId}
                buyerName={order.buyer?.fullName ?? 'Comprador'}
              />
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}