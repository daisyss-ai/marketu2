import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Edit2,
  Trash2,
  Heart,
  MessageCircle,
  ShoppingCart,
  Plus,
  Star,
  Package,
  TrendingUp,
  Award,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useUserProfile, useUserProducts, useDeleteProduct } from '../hooks/useAPI';
import { LoadingSpinner, FormAlert } from '../components/FormFields';

const Profile = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('products');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const { profile, stats, loading: profileLoading } = useUserProfile(authUser?.id);
  const { products, loading: productsLoading } = useUserProducts(authUser?.id, 1, 12);
  const { deleteProduct, loading: deleteLoading } = useDeleteProduct();

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setAlertMessage({ type: 'success', text: 'Produto deletado com sucesso!' });
      setDeleteConfirm(null);
      // Refresh products list
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setAlertMessage({
        type: 'error',
        text: error.message || 'Erro ao deletar produto',
      });
    }
  };

  if (!authUser) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Você não está autenticado.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#4B187C] text-white px-4 py-2 rounded hover:bg-[#3E1367]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const displayName = authUser?.full_name || 'Usuário';
  const studentInfo = `${authUser?.student_id || 'N/A'} • ${authUser?.course || 'Curso'} • ${authUser?.classroom || 'Sala'}`;
  const avgRating = stats?.stats?.avgRating || 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* Profile Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-6 flex-1">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {displayName?.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                <p className="text-sm text-gray-600 mb-2">{studentInfo}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{avgRating}</span>
                  <span className="text-gray-600">
                    ({stats?.stats?.reviewCount || 0} avaliações)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/publish-product')}
                className="flex items-center gap-2 bg-[#4B187C] text-white px-4 py-2 rounded-lg hover:bg-[#3E1367] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publicar Produto
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package className="w-6 h-6" />}
              label="Produtos à Venda"
              value={stats?.stats?.productCount || 0}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Vendas Concluídas"
              value={stats?.stats?.completedSales || 0}
            />
            <StatCard
              icon={<Star className="w-6 h-6" />}
              label="Avaliação"
              value={avgRating}
              isRating
            />
            <StatCard
              icon={<Award className="w-6 h-6" />}
              label="Taxa Positiva"
              value={stats?.stats?.positiveRating || '0%'}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {alertMessage && (
          <FormAlert
            type={alertMessage.type}
            message={alertMessage.text}
            onClose={() => setAlertMessage(null)}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <TabButton
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
          >
            <Package className="w-4 h-4" />
            Meus Produtos
          </TabButton>
          <TabButton
            active={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          >
            <ShoppingCart className="w-4 h-4" />
            Minhas Ações
          </TabButton>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {profileLoading || productsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Carregando produtos..." />
              </div>
            ) : products?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onEdit={(id) => navigate(`/edit-product/${id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum produto publicado"
                description="Você ainda não tem nenhum produto. Clique no botão abaixo para publicar o seu primeiro!"
                onAction={() => navigate('/publish-product')}
                actionText="Publicar Primeiro Produto"
              />
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActionCard
              icon={<ShoppingCart className="w-8 h-8" />}
              title="Minhas Compras"
              description="Acompanhe suas compras e transações"
              onClick={() => setActiveTab('purchases')}
            />
            <ActionCard
              icon={<Heart className="w-8 h-8" />}
              title="Favoritos"
              description="Veja os produtos que você salvou"
              onClick={() => navigate('/favorites')}
            />
            <ActionCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="Mensagens"
              description="Converse com vendedores e compradores"
              onClick={() => navigate('/messages')}
            />
            <ActionCard
              icon={<Edit2 className="w-8 h-8" />}
              title="Editar Perfil"
              description="Atualize suas informações"
              onClick={() => navigate('/edit-profile')}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-xl font-bold mb-2">Deletar Produto?</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que quer deletar este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatCard = ({ icon, label, value, isRating = false }) => (
  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm font-medium">{label}</span>
      <div className="text-purple-600">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{isRating ? value.toFixed(1) : value}</div>
  </div>
);

// Product Card Component
const ProductCard = ({ product, onDelete, onEdit }) => (
  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
    <div className="relative h-48 bg-gray-100 overflow-hidden">
      {product.image_urls?.[0] ? (
        <img
          src={product.image_urls[0]}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <span className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
        {product.condition}
      </span>
    </div>

    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
      <p className="text-lg font-bold text-[#4B187C] mb-4">{product.price.toLocaleString()} Kz</p>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product.id)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Deletar
        </button>
      </div>
    </div>
  </div>
);

// Tab Button Component
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
      active
        ? 'text-[#4B187C] border-b-2 border-[#4B187C]'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

// Action Card Component
const ActionCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow text-left group"
  >
    <div className="text-purple-600 mb-3 group-hover:text-[#4B187C] transition-colors">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

// Empty State Component
const EmptyState = ({ title, description, onAction, actionText }) => (
  <div className="py-12 text-center">
    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <button
      onClick={onAction}
      className="bg-[#4B187C] text-white px-6 py-2 rounded-lg hover:bg-[#3E1367] transition-colors"
    >
      {actionText}
    </button>
  </div>
);

export default Profile;
