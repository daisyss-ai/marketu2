'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, ChevronLeft, AlertCircle, Package } from 'lucide-react';
import Header from '../layout/Header';
import { useAuthStore } from '../../store/authStore';

const OrdersPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos');
      }

      const result = await response.json();
      setOrders(result.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Erro ao carregar seus pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Enviado' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregue' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12 flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Você tem {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Você ainda não fez nenhum pedido
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Comece a comprar e seus pedidos aparecerão aqui
              </p>
              <button
                onClick={() => router.push('/home')}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Voltar à loja
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Order ID */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Pedido
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Data
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  {/* Total */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Total
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {typeof order.total_amount === 'number'
                        ? order.total_amount.toLocaleString('pt-AO')
                        : order.total_amount}{' '}
                      Kz
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-end justify-between md:justify-end">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Items count */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {order.order_items?.length || 0} item
                    {order.order_items?.length !== 1 ? 's' : ''} no pedido
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
