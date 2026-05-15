'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import OrderCard from '@/components/orders/OrderCard';
import type { Order, OrderStatus } from '@/lib/orders/getOrders';
import { cn } from '@/lib/utils';

type OrderFilter = 'all' | 'in_progress' | 'delivered' | 'cancelled';

interface OrdersPageProps {
  orders: Order[];
}

interface FilterTab {
  key: OrderFilter;
  label: string;
}

const filterTabs: FilterTab[] = [
  { key: 'all', label: 'Todos' },
  { key: 'in_progress', label: 'Em curso' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'cancelled', label: 'Cancelados' },
];

function matchesFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === 'all') return true;
  if (filter === 'in_progress') {
    return status === 'pending' || status === 'confirmed';
  }
  return status === filter;
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-muted/10 bg-surface p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 border-b border-muted/10 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="h-3 w-28 rounded-full bg-muted/10" />
              <div className="h-6 w-56 rounded-full bg-muted/10" />
              <div className="h-4 w-40 rounded-full bg-muted/10" />
            </div>
            <div className="space-y-3">
              <div className="ml-auto h-8 w-28 rounded-full bg-muted/10" />
              <div className="ml-auto h-8 w-32 rounded-full bg-muted/10" />
            </div>
          </div>

          <div className="space-y-4 py-5">
            {Array.from({ length: 2 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className="rounded-2xl border border-muted/10 bg-muted/5 p-4"
              >
                <div className="mb-3 h-5 w-2/3 rounded-full bg-muted/10" />
                <div className="mb-4 h-4 w-1/2 rounded-full bg-muted/10" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 rounded-full bg-muted/10" />
                  <div className="h-4 rounded-full bg-muted/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage({ orders }: OrdersPageProps) {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsHydrating(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilter(order.status, activeFilter)),
    [activeFilter, orders]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <section className="rounded-3xl bg-primary px-6 py-8 text-primary-foreground shadow-lg md:px-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground/75">
              Área do comprador
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Acompanha todos os teus pedidos
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              Consulta o estado de cada compra, revê os itens do pedido e confirma os
              detalhes de levantamento num único lugar.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Os teus pedidos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {orders.length} pedido{orders.length === 1 ? '' : 's'} registado
                {orders.length === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => {
                const isActive = tab.key === activeFilter;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-primary/10',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-muted/10 bg-surface text-muted-foreground hover:border-primary/25 hover:text-primary'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isHydrating ? <OrdersSkeleton /> : null}

          {!isHydrating && filteredOrders.length > 0 ? (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : null}

          {!isHydrating && filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-muted/20 bg-surface px-6 py-16 text-center shadow-sm">
              <div className="mx-auto max-w-md space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  {orders.length === 0
                    ? 'Ainda não tens pedidos'
                    : 'Nenhum pedido nesta categoria'}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {orders.length === 0
                    ? 'Explora os produtos disponíveis no marketplace e faz a tua primeira compra.'
                    : 'Muda o filtro ou continua a explorar o marketplace para encontrar mais produtos.'}
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/20"
                >
                  Ir às compras
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
