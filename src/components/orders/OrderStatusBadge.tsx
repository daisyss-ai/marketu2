import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/orders/getOrders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-gray-100 text-gray-600',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-blue-50 text-blue-600',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-green-50 text-green-600',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-50 text-red-500',
  },
};

export default function OrderStatusBadge({
  status,
  className,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
