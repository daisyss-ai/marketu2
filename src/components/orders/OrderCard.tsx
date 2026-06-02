'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Package2 } from 'lucide-react';
import { updateOrderStatusAction } from '@/app/actions/orders';
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

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getVisibleActions(mode: OrderMode, status: OrderStatus): OrderStatus[] {
  if (mode === 'buyer') {
    return status === 'pending' ? ['cancelled'] : [];
  }

  if (status === 'pending') {
    return ['confirmed', 'cancelled'];
  }

  if (status === 'confirmed') {
    return ['delivered'];
  }

  return [];
}

function getActionLabel(status: OrderStatus): string {
  if (status === 'confirmed') return 'Confirmar disponibilidade';
  if (status === 'delivered') return 'Marcar como entregue';
  return 'Cancelar';
}

function getActionClassName(status: OrderStatus): string {
  if (status === 'confirmed') {
    return 'border-blue-200 text-blue-600 hover:bg-blue-50';
  }

  if (status === 'delivered') {
    return 'border-green-200 text-green-600 hover:bg-green-50';
  }

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
    mode === 'buyer' ? order.seller?.fullName || 'Vendedor MarketU' : order.buyer?.fullName || 'Comprador MarketU';
  const availableActions = getVisibleActions(mode, order.status);

  if (!firstItem) {
    return null;
  }

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
              <p className="mt-1 text-sm text-gray-500">
                Quantidade: {firstItem.quantity} • {formatCurrency(firstItem.unitPrice)}
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
                {availableActions.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    onClick={() => handleStatusAction(nextStatus)}
                    disabled={isPending}
                    className={cn(
                      'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                      getActionClassName(nextStatus)
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A actualizar...
                      </>
                    ) : (
                      getActionLabel(nextStatus)
                    )}
                  </button>
                ))}
              </div>
              {actionError ? (
                <p className="text-sm text-red-500">{actionError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
