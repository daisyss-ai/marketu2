import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/orders/getOrders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendente',
    className: 'bg-muted/10 text-muted-foreground border-muted/20',
  },
  confirmed: {
    label: 'Em curso',
    className: 'bg-primary/10 text-focus border-primary/15',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-success/10 text-success border-success/20',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-error/10 text-error border-error/20',
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
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
