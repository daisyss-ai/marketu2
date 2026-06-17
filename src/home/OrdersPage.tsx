'use client';

// import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, /* Loader2, Package2 */ } from 'lucide-react';
import Header from '@/components/layout/Header';
import CartItem from '@/components/orders/CartItem';
import OrderCard from '@/components/orders/OrderCard';
import type { Order, OrderMode, OrderStatus } from '@/lib/orders/getOrders';
import { createOrderAction } from '@/app/actions/orders';
import { unsaveProductAction } from '@/app/actions/saved';
import type { SavedProduct } from '@/lib/saved/getSavedProducts';
import { cn } from '@/lib/utils';

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
type OrdersViewMode = OrderMode | 'cart';
type CartAction = 'interest' | 'remove';

interface OrdersPageProps {
  buyerOrders: Order[];
  sellerOrders: Order[];
  savedProducts: SavedProduct[];
  currentUserId: string;
}

interface FilterTab {
  key: OrderFilter;
  label: string;
}

interface ModeTab {
  key: OrdersViewMode;
  label: string;
}

const modeTabs: ModeTab[] = [
  { key: 'buyer', label: 'As minhas compras' },
  { key: 'cart', label: 'Carrinho' },
  { key: 'seller', label: 'As minhas vendas' },
];

const filterTabs: FilterTab[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendente' },
  { key: 'confirmed', label: 'Em curso' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'cancelled', label: 'Cancelados' },
];

function normalizeMode(value: string | null): OrdersViewMode {
  if (value === 'buyer' || value === 'seller' || value === 'cart') {
    return value;
  }

  return 'cart';
}

function isOrderMode(mode: OrdersViewMode): mode is OrderMode {
  return mode === 'buyer' || mode === 'seller';
}

function matchesFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === 'all') return status !== 'cancelled';
  if (filter === 'cancelled') return status === 'cancelled';
  return status === filter;
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-20 w-20 rounded-2xl bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/2 rounded-full bg-gray-100" />
              <div className="h-4 w-2/3 rounded-full bg-gray-100" />
              <div className="h-4 w-1/3 rounded-full bg-gray-100" />
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="h-4 w-20 rounded-full bg-gray-100" />
                <div className="h-9 w-36 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-2xl bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 rounded-full bg-gray-100" />
              <div className="h-4 w-1/2 rounded-full bg-gray-100" />
              <div className="h-4 w-1/3 rounded-full bg-gray-100" />
              <div className="flex gap-2 pt-2">
                <div className="h-10 w-32 rounded-full bg-gray-100" />
                <div className="h-10 w-24 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage({
  buyerOrders,
  sellerOrders,
  savedProducts,
  currentUserId,
}: OrdersPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMode, setActiveMode] = useState<OrdersViewMode>(() =>
    normalizeMode(searchParams.get('tab'))
  );
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [isHydrating, setIsHydrating] = useState(true);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({});
  const [savedItems, setSavedItems] = useState<SavedProduct[]>(savedProducts);
  const [pendingCartProductId, setPendingCartProductId] = useState<string | null>(null);
  const [pendingCartAction, setPendingCartAction] = useState<CartAction | null>(null);
  const [cartErrors, setCartErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsHydrating(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    setSavedItems(savedProducts);
  }, [savedProducts]);

  useEffect(() => {
    setActiveMode(normalizeMode(searchParams.get('tab')));
  }, [searchParams]);

  const ordersByMode = useMemo<Record<OrderMode, Order[]>>(
    () => ({
      buyer: buyerOrders.map((order) => ({
        ...order,
        status: statusOverrides[order.id] ?? order.status,
      })),
      seller: sellerOrders.map((order) => ({
        ...order,
        status: statusOverrides[order.id] ?? order.status,
      })),
    }),
    [buyerOrders, sellerOrders, statusOverrides]
  );

  const visibleOrders = useMemo(() => {
    if (!isOrderMode(activeMode)) {
      return [];
    }

    if (activeMode === 'buyer') {
      return ordersByMode.buyer.filter((order) => matchesFilter(order.status, activeFilter));
    }

    return ordersByMode.seller.filter((order) => matchesFilter(order.status, activeFilter));
  }, [activeFilter, activeMode, ordersByMode]);

  const activeCount =
    activeMode === 'cart'
      ? savedItems.length
      : activeMode === 'buyer'
        ? ordersByMode.buyer.length
        : ordersByMode.seller.length;

  const emptyState =
    activeMode === 'buyer'
      ? {
          title: 'Ainda nao fizeste nenhuma compra',
          description: 'Explora os produtos disponiveis',
          ctaHref: '/home',
          ctaLabel: 'Explorar produtos',
        }
      : activeMode === 'seller'
        ? {
            title: 'Ainda nao tens vendas',
            description: 'Publica um produto para comecar a vender no MarketU',
            ctaHref: '/sell',
            ctaLabel: 'Vender produto',
          }
        : {
            title: 'O teu carrinho esta vazio',
            description: 'Guarda produtos para revisitar mais tarde.',
            ctaHref: '/home',
            ctaLabel: 'Explorar produtos',
          };

  const pushMode = (nextMode: OrdersViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextMode);
    const query = params.toString();

    router.replace(query ? `/orders?${query}` : '/orders', { scroll: false });
  };

  const handleModeChange = (nextMode: OrdersViewMode) => {
    setActiveMode(nextMode);
    if (nextMode !== activeMode) {
      setActiveFilter('all');
    }
    pushMode(nextMode);
  };

  const handleStatusUpdated = (_mode: OrderMode, orderId: string, status: OrderStatus) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [orderId]: status,
    }));
  };

  const dispatchSavedProductsChanged = () => {
    window.dispatchEvent(new Event('saved-products-changed'));
  };

  const handleCartError = (productId: string, message: string | null) => {
    setCartErrors((prev) => ({
      ...prev,
      [productId]: message,
    }));
  };

  const handleRemoveSavedProduct = async (product: SavedProduct) => {
    if (pendingCartProductId) return;

    setPendingCartProductId(product.productId);
    setPendingCartAction('remove');
    handleCartError(product.productId, null);

    const result = await unsaveProductAction(product.productId);

    if (!result.success) {
      handleCartError(product.productId, result.error || 'Nao foi possivel remover o produto do carrinho.');
      setPendingCartAction(null);
      setPendingCartProductId(null);
      return;
    }

    setSavedItems((prev) => prev.filter((item) => item.productId !== product.productId));
    dispatchSavedProductsChanged();
    setPendingCartAction(null);
    setPendingCartProductId(null);
  };

  const handleInterestClick = async (product: SavedProduct) => {
    if (pendingCartProductId) return;

    setPendingCartProductId(product.productId);
    setPendingCartAction('interest');
    handleCartError(product.productId, null);

    const result = await createOrderAction(product.productId);

    if (!result.success) {
      handleCartError(product.productId, result.error || 'Nao foi possivel criar o pedido.');
      setPendingCartAction(null);
      setPendingCartProductId(null);
      return;
    }

    setSavedItems((prev) => prev.filter((item) => item.productId !== product.productId));
    dispatchSavedProductsChanged();
    setActiveMode('buyer');
    setActiveFilter('all');
    pushMode('buyer');
    setPendingCartAction(null);
    setPendingCartProductId(null);
  };

  const renderMainContent = () => {
    if (isHydrating) {
      return activeMode === 'cart' ? <CartSkeleton /> : <OrdersSkeleton />;
    }

    if (activeMode === 'cart') {
      if (savedItems.length > 0) {
        return (
          <div className="space-y-4">
            {savedItems.map((product) => (
              <CartItem
                key={product.productId}
                product={product}
                isInterestPending={
                  pendingCartProductId === product.productId && pendingCartAction === 'interest'
                }
                isRemovePending={
                  pendingCartProductId === product.productId && pendingCartAction === 'remove'
                }
                isActionPending={Boolean(pendingCartProductId)}
                error={cartErrors[product.productId] ?? null}
                onInterest={handleInterestClick}
                onRemove={handleRemoveSavedProduct}
              />
            ))}
          </div>
        );
      }
    } else if (isOrderMode(activeMode) && visibleOrders.length > 0) {
      return (
        <div className="space-y-4">
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
      );
    }

    return null;
  };

  const showEmptyState =
    !isHydrating &&
    ((activeMode === 'cart' && savedItems.length === 0) ||
      (isOrderMode(activeMode) && visibleOrders.length === 0));

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Os meus pedidos</h1>
          <p className="mt-2 text-sm text-gray-500">
            {activeCount} item{activeCount === 1 ? '' : 's'} encontrados
          </p>
        </section>

        <section className="mt-6">
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-8 border-b border-gray-100">
              {modeTabs.map((tab) => {
                const isActive = tab.key === activeMode;
                const count =
                  tab.key === 'cart'
                    ? savedItems.length
                    : tab.key === 'buyer'
                      ? ordersByMode.buyer.length
                      : ordersByMode.seller.length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleModeChange(tab.key)}
                    className={cn(
                      'relative -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    )}
                  >
                    {tab.label}
                    <span className="ml-2 text-xs text-gray-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isOrderMode(activeMode) ? (
            <div className="mt-4 overflow-x-auto">
              <div className="flex min-w-max items-center gap-6 border-b border-gray-100">
                {filterTabs.map((tab) => {
                  const isActive = tab.key === activeFilter;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key)}
                      className={cn(
                        'relative -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-primary text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            {renderMainContent()}

            {showEmptyState ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-gray-900">{emptyState.title}</h2>
                <p className="mt-2 text-sm text-gray-500">{emptyState.description}</p>
                <Link
                  href={emptyState.ctaHref}
                  className="mt-6 inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  {emptyState.ctaLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
