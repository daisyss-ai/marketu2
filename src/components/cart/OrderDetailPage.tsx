'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader, ChevronLeft, AlertCircle, Package, Truck } from 'lucide-react';
import Header from '../layout/Header';

interface OrderDetailPageProps {
  orderId?: string;
}

const OrderDetailPage = ({ orderId: propOrderId }: OrderDetailPageProps) => {
  const router = useRouter();
  const params = useParams();
  const orderId = propOrderId || (params?.id as string);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Pedido não encontrado');
      }

      const result = await response.json();
      setOrder(result.data);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Enviado', icon: Truck },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregue', icon: Package },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-error font-medium">{error}</p>
            </div>
            <button
              onClick={() => router.push('/orders')}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Voltar para Meus Pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-gray-600 text-sm">
                Colocado em {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items list */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Itens do Pedido
              </h2>

              <div className="space-y-4">
                {order.order_items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    {/* Product image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.products?.image_urls?.[0] || '/assets/placeholder-product.png'}
                        alt={item.products?.title || 'Produto'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.products?.title || 'Produto'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="font-medium text-gray-900">
                        {typeof item.price === 'number'
                          ? item.price.toLocaleString('pt-AO')
                          : item.price}{' '}
                        Kz un.
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {typeof item.price === 'number'
                          ? (item.price * item.quantity).toLocaleString('pt-AO')
                          : item.price}{' '}
                        Kz
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Informações de Entrega
              </h2>

              <div className="space-y-3">
                {order.shipping_address && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-900">{order.shipping_address}</p>
                  </div>
                )}

                {order.shipping_phone && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Telefone
                    </p>
                    <p className="text-sm text-gray-900">{order.shipping_phone}</p>
                  </div>
                )}

                {order.shipping_notes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Observações
                    </p>
                    <p className="text-sm text-gray-900">{order.shipping_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Resumo</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {typeof order.total_amount === 'number'
                      ? order.total_amount.toLocaleString('pt-AO')
                      : order.total_amount}{' '}
                    Kz
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envio:</span>
                  <span className="font-medium text-gray-900">Gratuito</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Imposto:</span>
                  <span className="font-medium text-gray-900">Incluído</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-primary">
                  {typeof order.total_amount === 'number'
                    ? order.total_amount.toLocaleString('pt-AO')
                    : order.total_amount}{' '}
                  Kz
                </span>
              </div>

              {/* Order status timeline */}
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900 mb-3">Status:</p>
                <div className="space-y-2">
                  {['pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
                    <div
                      key={status}
                      className={`flex items-center gap-2 ${
                        order.status === status
                          ? 'text-primary font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          order.status === status
                            ? 'bg-primary'
                            : 'bg-gray-300'
                        }`}
                      />
                      {status === 'pending' && 'Pendente'}
                      {status === 'confirmed' && 'Confirmado'}
                      {status === 'shipped' && 'Enviado'}
                      {status === 'delivered' && 'Entregue'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
