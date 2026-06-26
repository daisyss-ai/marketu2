'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  Plus,
  Package,
  TrendingUp,
  Award,
  GraduationCap,
  Check,
  Star,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useUserProfile, useUserProducts } from '../hooks/useAPI';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, FormAlert } from '../components/FormFields';
import type { ProductWithDetails } from '../types';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isRating?: boolean;
  reviewCount?: number;
}

const StatCard = ({ icon, label, value, isRating = false, reviewCount }: StatCardProps) => (
  <div className="bg-white p-4 rounded-2xl border border-[#EDE7FF] shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</span>
      <div className="text-[#4B187C]">{icon}</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800">
        {isRating && typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      {isRating && reviewCount !== undefined && (
        <div className="text-sm text-gray-400 font-normal">({reviewCount})</div>
      )}
    </div>
  </div>
);

interface ProductCardProps {
  product: ProductWithDetails;
  onDelete: (id: string | number) => void;
  onEdit: (id: string | number) => void;
}

const ProductCard = ({ product, onDelete, onEdit }: ProductCardProps) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
    <div className="relative h-44 bg-gray-200">
      {product.preview_url ? (
        <img
          src={product.preview_url}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
        product.is_active
          ? 'bg-white/90 text-green-600'
          : 'bg-gray-800 text-white'
      }`}>
        {product.is_active ? 'Ativo' : 'Inativo'}
      </span>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button
          onClick={() => onEdit(product.id)}
          className="bg-white p-2 rounded-full text-[#4B187C] hover:bg-gray-100"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="bg-white p-2 rounded-full text-red-500 hover:bg-gray-100"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-gray-800 line-clamp-1">{product.title}</h3>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 whitespace-nowrap">
          {product.stock || 0} disp.
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{product.category_name || 'Geral'}</p>
      <p className="text-lg font-bold text-[#4B187C]">
        {product.is_free ? 'Gratuito' : `${(product.price ?? 0).toLocaleString('pt-AO')} Kz`}
      </p>
    </div>
  </div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-sm border-b-2 transition-colors ${
      active
        ? 'border-[#4B187C] text-[#4B187C] font-semibold'
        : 'border-transparent text-gray-500 font-medium hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

const Profile = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('products');
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setIsHydrated(true));
  }, []);

  const { stats, loading: profileLoading } = useUserProfile(authUser?.id);
  const { products, loading: productsLoading } = useUserProducts(authUser?.id, 1, 12);

  const handleDeleteProduct = async (productId: string | number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw new Error(error.message);

      setAlertMessage({ type: 'success', text: 'Produto desactivado com sucesso!' });
      setDeleteConfirm(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setAlertMessage({ type: 'error', text: error.message || 'Erro ao desactivar produto' });
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-[#f8f7ff] min-h-screen">
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-600">
          Carregando...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Não estás autenticado.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#4B187C] text-white px-4 py-2 rounded hover:bg-[#3E1367]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const displayName = (authUser as any)?.username || authUser?.full_name || 'Utilizador';
  const avgRating = stats?.stats?.avgRating || 0;
  const reviewCount = stats?.stats?.reviewCount || 0;
  const avatarUrl = (authUser as any)?.avatar_url;
  const bannerUrl = (authUser as any)?.banner_url;

  return (
    <div className="bg-[#f8f7ff] min-h-screen">
      <Header />

      {/* Banner */}
      <div className="relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 w-full bg-gradient-to-r from-[#4B187C] to-[#6d28b0]" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="flex flex-col gap-4">
            {/* Avatar */}
            <div className="relative w-fit">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#EDE7FF] flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-[#4B187C]">
                    {displayName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute bottom-1 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Name and info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h1>
              {/* Turma, Curso, Sala */}
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{authUser?.student_id || 'N/A'} • {authUser?.course || 'Curso'} • {authUser?.classroom || 'Sala'}</span>
              </div>

              {/* Biografia */}
              {(authUser as any)?.bio && (
                <p className="text-gray-600 text-sm mt-2 max-w-md">{(authUser as any).bio}</p>
              )}

              {/* Seguidores e Seguindo */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-700"><strong>{stats?.stats?.followersCount || 0}</strong> <span className="text-gray-400">seguidores</span></span>
                <span className="text-gray-700"><strong>{stats?.stats?.followingCount || 0}</strong> <span className="text-gray-400">a seguir</span></span>
              </div>

              {/* Redes sociais */}
              {(authUser as any)?.social_url && (
                <a
                  href={(authUser as any).social_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4B187C] text-sm mt-1 underline underline-offset-2 hover:text-[#3E1367] inline-block"
                >
                  {(authUser as any).social_url}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and content */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {alertMessage && (
          <FormAlert
            type={alertMessage.type}
            message={alertMessage.text}
            onClose={() => setAlertMessage(null)}
          />
        )}

        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')}>
            Meus Produtos
          </TabButton>
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
            Avaliações & Vendas
          </TabButton>
        </div>

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
                    onEdit={(id) => router.push(`/profile/${id}/edit`)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div
                  onClick={() => router.push('/sell')}
                  className="border-2 border-dashed border-[#EDE7FF] rounded-2xl flex flex-col items-center justify-center p-6 bg-white hover:bg-purple-50 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-[#4B187C]">Anunciar Algo</p>
                  <p className="text-xs text-gray-400">Rápido e fácil</p>
                </div>

                {products && products.length > 0 ? (
                  products.map((product: ProductWithDetails) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDelete={(id) => setDeleteConfirm(id)}
                      onEdit={(id) => router.push(`/profile/${id}/edit`)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto publicado</h3>
                    <p className="text-gray-600 mb-6">
                      Ainda não tens nenhum produto. Clica no botão para publicar o teu primeiro!
                    </p>
                    <button
                      onClick={() => router.push('/sell')}
                      className="bg-[#4B187C] text-white px-6 py-2 rounded-lg hover:bg-[#3E1367] transition-colors"
                    >
                      Publicar Primeiro Produto
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Produtos à Venda"
                value={stats?.stats?.productCount || 0}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Vendas Concluídas"
                value={stats?.stats?.completedSales || 0}
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                label="Avaliação"
                value={avgRating}
                isRating
                reviewCount={reviewCount}
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="Taxa Positiva"
                value={stats?.stats?.positiveRating || '0%'}
              />
            </div>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-xl font-bold mb-2">Desactivar Produto?</h3>
            <p className="text-gray-600 mb-6">
              O produto ficará invisível no marketplace mas pode ser reactivado depois.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
