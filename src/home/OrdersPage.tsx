'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import OrderCard from '@/components/orders/OrderCard';
import type { Order, OrderMode, OrderStatus } from '@/lib/orders/getOrders';
import { cn } from '@/lib/utils';

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
type OrdersViewMode = OrderMode;

interface OrdersPageProps {
  buyerOrders: Order[];
  sellerOrders: Order[];
  currentUserId: string;
}

const filterTabs: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendente' },
  { key: 'confirmed', label: 'Em curso' },
  { key: 'delivered', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

function normalizeMode(value: string | null): OrdersViewMode {
  if (value === 'buyer' || value === 'seller') return value;
  return 'buyer';
}

function matchesFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === 'all') return status !== 'cancelled';
  if (filter === 'cancelled') return status === 'cancelled';
  return status === filter;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-gray-100', className)} />;
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ mode }: { mode: OrdersViewMode }) {
  const config = mode === 'buyer'
    ? {
        icon: <ShoppingBag className="h-8 w-8 text-gray-300" />,
        title: 'Ainda não fizeste nenhuma compra',
        description: 'Explora os produtos disponíveis no MarketU.',
        cta: { href: '/home', label: 'Explorar produtos' },
      }
    : {
        icon: <Store className="h-8 w-8 text-gray-300" />,
        title: 'Ainda não tens vendas',
        description: 'Publica um produto para começar a vender.',
        cta: { href: '/sell', label: 'Vender produto' },
      };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
        {config.icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">{config.description}</p>
      <Link
        href={config.cta.href}
        className="mt-5 inline-flex rounded-full bg-[#4B187C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3a1260] transition-colors"
      >
        {config.cta.label}
      </Link>
    </div>
  );
}

export default function OrdersPage({ buyerOrders, sellerOrders, currentUserId }: OrdersPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMode, setActiveMode] = useState<OrdersViewMode>(() =>
    normalizeMode(searchParams.get('tab'))
  );
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [isHydrating, setIsHydrating] = useState(true);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({});

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsHydrating(false));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    setActiveMode(normalizeMode(searchParams.get('tab')));
  }, [searchParams]);

  const ordersByMode = useMemo<Record<OrderMode, Order[]>>(() => ({
    buyer: buyerOrders.map((o) => ({ ...o, status: statusOverrides[o.id] ?? o.status })),
    seller: sellerOrders.map((o) => ({ ...o, status: statusOverrides[o.id] ?? o.status })),
  }), [buyerOrders, sellerOrders, statusOverrides]);

  const visibleOrders = useMemo(() =>
    ordersByMode[activeMode].filter((o) => matchesFilter(o.status, activeFilter)),
    [activeFilter, activeMode, ordersByMode]
  );

  const pushMode = (nextMode: OrdersViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextMode);
    router.replace(`/orders?${params.toString()}`, { scroll: false });
  };

  const handleModeChange = (nextMode: OrdersViewMode) => {
    setActiveMode(nextMode);
    if (nextMode !== activeMode) setActiveFilter('all');
    pushMode(nextMode);
  };

  const handleStatusUpdated = (_mode: OrderMode, orderId: string, status: OrderStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [orderId]: status }));
  };

  const navItems: { key: OrdersViewMode; label: string; count: number }[] = [
    { key: 'buyer', label: 'Comprados', count: ordersByMode.buyer.length },
    { key: 'seller', label: 'Vendidos', count: ordersByMode.seller.length },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Os meus pedidos</h1>

        <div className="flex gap-6 items-start">

          {/* Nav lateral — desktop */}
          <aside className="hidden md:flex flex-col w-44 shrink-0 gap-0.5">
            {navItems.map((item) => {
              const isActive = item.key === activeMode;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleModeChange(item.key)}
                  className={cn(
                    'flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left',
                    isActive
                      ? 'bg-[#EDE7FF] text-[#4B187C] font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <span>{item.label}</span>
                  <span className={cn(
                    'text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center',
                    isActive ? 'bg-[#4B187C] text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">

            {/* Tabs mobile */}
            <div className="flex md:hidden gap-2 mb-4">
              {navItems.map((item) => {
                const isActive = item.key === activeMode;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleModeChange(item.key)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
                      isActive
                        ? 'bg-[#4B187C] text-white border-[#4B187C]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {item.label} <span className="ml-1 opacity-70">{item.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Filtros de status — pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {filterTabs.map((tab) => {
                const isActive = tab.key === activeFilter;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Lista */}
            {isHydrating ? (
              <OrdersSkeleton />
            ) : visibleOrders.length === 0 ? (
              <EmptyState mode={activeMode} />
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    currentUserId={currentUserId}
                    mode={activeMode}
                    onStatusUpdated={handleStatusUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}