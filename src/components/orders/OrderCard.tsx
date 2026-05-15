import type { Order, OrderProductType } from '@/lib/orders/getOrders';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';

interface OrderCardProps {
  order: Order;
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

export default function OrderCard({ order }: OrderCardProps) {
  const total = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <article className="rounded-3xl border border-muted/10 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-muted/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Pedido #{order.id.slice(0, 8)}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {order.items.length} item{order.items.length === 1 ? '' : 's'} no pedido
          </h2>
          <p className="text-sm text-muted-foreground">
            Feito em {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <OrderStatusBadge status={order.status} />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-2xl font-black text-foreground">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 py-5">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-muted/10 bg-muted/5 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold text-foreground">{item.productTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {productTypeLabels[item.productType]} · Quantidade: {item.quantity}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm md:min-w-[240px]">
              <div>
                <p className="font-semibold text-muted-foreground">Preço unitário</p>
                <p className="mt-1 font-bold text-foreground">
                  {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-semibold text-muted-foreground">Subtotal</p>
                <p className="mt-1 font-bold text-foreground">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(order.pickupLocation || order.notes) && (
        <div className="grid gap-4 border-t border-muted/10 pt-5 md:grid-cols-2">
          {order.pickupLocation ? (
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Local de levantamento
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {order.pickupLocation}
              </p>
            </div>
          ) : null}

          {order.notes ? (
            <div className="rounded-2xl bg-muted/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Notas
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{order.notes}</p>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
