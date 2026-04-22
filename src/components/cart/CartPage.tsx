'use client';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ChevronLeft } from 'lucide-react';
import Header from '../layout/Header';
import { useCartStore } from '../../store/cartStore';

const CartPage = () => {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCartStore();

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/home');
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={handleContinueShopping}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Continuar comprando
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg font-medium mb-2">
                🛒 Seu carrinho está vazio
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Adicione produtos para continuar com sua compra
              </p>
              <button
                onClick={handleContinueShopping}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all"
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
          onClick={handleContinueShopping}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Continuar comprando
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Carrinho ({items.length} item{items.length !== 1 ? 's' : ''})
                </h2>
                <button
                  onClick={clearCart}
                  className="text-error hover:text-error/80 text-sm font-medium"
                >
                  Limpar carrinho
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.product_id || index}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    {/* Product image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src="/assets/placeholder-product.png"
                        alt={item.product?.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.product?.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {typeof item.price === 'number'
                          ? item.price.toLocaleString('pt-AO')
                          : item.price}{' '}
                        Kz
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                          }
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1)
                          }
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Total and remove */}
                    <div className="text-right flex flex-col items-end justify-between">
                      <p className="font-bold text-gray-900">
                        {typeof item.price === 'number'
                          ? (item.price * item.quantity).toLocaleString('pt-AO')
                          : item.price}{' '}
                        Kz
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-1 rounded hover:bg-error/10 transition-colors text-error"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>

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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Imposto:</span>
                  <span className="font-medium text-gray-900">Incluído</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-primary">
                  {typeof totalAmount === 'number'
                    ? totalAmount.toLocaleString('pt-AO')
                    : totalAmount}{' '}
                  Kz
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all shadow-md"
              >
                Prosseguir para Pagamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
