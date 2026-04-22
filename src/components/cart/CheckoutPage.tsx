'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, ChevronLeft, AlertCircle } from 'lucide-react';
import Header from '../layout/Header';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const CheckoutPage = () => {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.user_metadata?.full_name || '',
    phone: '',
    address: '',
    city: '',
    province: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.fullName.trim()) {
        throw new Error('Nome completo é obrigatório');
      }
      if (!formData.phone.trim()) {
        throw new Error('Telefone é obrigatório');
      }
      if (!formData.address.trim()) {
        throw new Error('Endereço é obrigatório');
      }
      if (!formData.city.trim()) {
        throw new Error('Cidade é obrigatória');
      }
      if (!formData.province.trim()) {
        throw new Error('Província é obrigatória');
      }

      if (items.length === 0) {
        throw new Error('Seu carrinho está vazio');
      }

      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingInfo: {
            address: formData.address,
            phone: formData.phone,
            notes: formData.notes,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar pedido');
      }

      const result = await response.json();
      clearCart();

      // Redirect to order confirmation
      router.push(`/orders/${result.data.id}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
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
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg font-medium mb-2">
                🛒 Seu carrinho está vazio
              </p>
              <button
                onClick={() => router.push('/home')}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all mt-4"
              >
                Voltar à loja
              </button>
            </div>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Informações de Entrega
              </h2>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                  />
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="João Silva"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+244 923 456 789"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Endereço Completo *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Avenida principal, número 123"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                {/* City and Province */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Luanda"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Província *
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="Luanda"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Instruções de entrega, referências..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.title} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {typeof item.price === 'number'
                        ? (item.price * item.quantity).toLocaleString('pt-AO')
                        : item.price}{' '}
                      Kz
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {typeof totalAmount === 'number'
                      ? totalAmount.toLocaleString('pt-AO')
                      : totalAmount}{' '}
                    Kz
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envio:</span>
                  <span className="font-medium text-gray-900">Gratuito</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-primary">
                  {typeof totalAmount === 'number'
                    ? totalAmount.toLocaleString('pt-AO')
                    : totalAmount}{' '}
                  Kz
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
