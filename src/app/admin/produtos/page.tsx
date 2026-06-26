'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Tags,
  Calendar,
  Search,
  ExternalLink,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  Euro,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getProductsByModeration,
  getCategories,
  getInstitutions,
  approveProduct,
  rejectProduct,
  removeProduct,
} from './actions';
import type { ProductModerationRow, ModerationStatus, Category, Institution } from './actions';

type TabConfig = {
  key: ModerationStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
};

const TABS: TabConfig[] = [
  { key: 'pending', label: 'Pendentes', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { key: 'approved', label: 'Aprovados', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { key: 'rejected', label: 'Rejeitados', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
];

const MODAL_CARD = 'bg-white rounded-3xl border border-[#EDE7FF] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in';

function formatPrice(price: number | null, isFree: boolean | null): string {
  if (isFree) return 'Grátis';
  if (price == null) return '---';
  return `${price.toFixed(2)} €`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProductTypeLabel(type: string): string {
  const map: Record<string, string> = {
    digital_material: 'Material Digital',
    service: 'Serviço',
    physical_product: 'Produto Físico',
  };
  return map[type] || type;
}

function StatusBadge({ status }: { status: ModerationStatus }) {
  const config = TABS.find(t => t.key === status);
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bgColor} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function ProdutosPage() {
  const [activeTab, setActiveTab] = useState<ModerationStatus>('pending');
  const [products, setProducts] = useState<ProductModerationRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [rejectingItem, setRejectingItem] = useState<ProductModerationRow | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const [removingItem, setRemovingItem] = useState<ProductModerationRow | null>(null);

  const loadData = useCallback(async (tab: ModerationStatus) => {
    setIsLoading(true);
    const [prodRes, catRes, instRes] = await Promise.all([
      getProductsByModeration(tab),
      getCategories(),
      getInstitutions(),
    ]);

    if (prodRes.success) {
      setProducts(prodRes.data);
    } else {
      toast.error(prodRes.error || 'Erro ao carregar produtos.');
    }

    if (catRes.success) {
      setCategories(catRes.data);
    } else {
      toast.error(catRes.error || 'Erro ao carregar categorias.');
    }

    if (instRes.success) {
      setInstitutions(instRes.data);
    } else {
      toast.error(instRes.error || 'Erro ao carregar instituições.');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const handleFilter = async () => {
    setIsLoading(true);
    const res = await getProductsByModeration(activeTab, {
      categoryId: filterCategory || undefined,
      institutionId: filterInstitution || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    });
    if (res.success) {
      setProducts(res.data);
    } else {
      toast.error(res.error || 'Erro ao filtrar produtos.');
    }
    setIsLoading(false);
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterInstitution('');
    setFilterDateFrom('');
    setFilterDateTo('');
    loadData(activeTab);
  };

  const handleApprove = async (item: ProductModerationRow) => {
    if (actionLoadingId) return;
    setActionLoadingId(item.id);

    try {
      const res = await approveProduct(item.id, item.product_id);
      if (res.success) {
        toast.success('Produto aprovado com sucesso!');
        setProducts(prev => prev.filter(p => p.id !== item.id));
      } else {
        toast.error(res.error || 'Erro ao aprovar produto.');
      }
    } catch {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (item: ProductModerationRow) => {
    setRejectingItem(item);
    setRejectionNote('');
    setRejectionError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionNote.trim()) {
      setRejectionError('O motivo de rejeição é obrigatório.');
      return;
    }

    setActionLoadingId(rejectingItem.id);
    const id = rejectingItem.id;
    const productId = rejectingItem.product_id;

    try {
      const res = await rejectProduct(id, productId, rejectionNote);
      if (res.success) {
        toast.success('Produto rejeitado com sucesso.');
        setProducts(prev => prev.filter(p => p.id !== id));
        setRejectingItem(null);
      } else {
        toast.error(res.error || 'Erro ao rejeitar produto.');
      }
    } catch {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRemove = (item: ProductModerationRow) => {
    setRemovingItem(item);
  };

  const handleConfirmRemove = async () => {
    if (!removingItem) return;
    setActionLoadingId(removingItem.id);
    const productId = removingItem.product_id;

    try {
      const res = await removeProduct(productId);
      if (res.success) {
        toast.success('Produto removido da plataforma.');
        setProducts(prev => prev.filter(p => p.id !== removingItem.id));
        setRemovingItem(null);
      } else {
        toast.error(res.error || 'Erro ao remover produto.');
      }
    } catch {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const productImage = (item: ProductModerationRow): string | null => {
    const media = item.products?.product_media || [];
    const preview = media.find(m => m.is_preview);
    if (preview) return preview.url;
    const sorted = [...media].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted[0]?.url || null;
  };

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#4B187C]" />
            Moderação de Produtos
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">
            Revise, aprove ou rejeite os produtos submetidos na plataforma.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-[#EDE7FF]">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? `${tab.color} border-b-2 border-[#4B187C] bg-[#f8f7ff]`
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[#EDE7FF] bg-gray-50/50">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Categoria</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="text-xs bg-white border border-[#EDE7FF] rounded-xl px-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer min-w-[160px]"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Instituição</label>
              <select
                value={filterInstitution}
                onChange={e => setFilterInstitution(e.target.value)}
                className="text-xs bg-white border border-[#EDE7FF] rounded-xl px-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer min-w-[160px]"
              >
                <option value="">Todas</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">De</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="text-xs bg-white border border-[#EDE7FF] rounded-xl px-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Até</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="text-xs bg-white border border-[#EDE7FF] rounded-xl px-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C]"
              />
            </div>

            <button
              onClick={handleFilter}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4B187C] hover:bg-[#3d1266] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Filtrar
            </button>

            {(filterCategory || filterInstitution || filterDateFrom || filterDateTo) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#4B187C]" />
            <p className="text-sm font-semibold text-gray-500">A carregar produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Nenhum produto {activeTab === 'pending' ? 'pendente' : activeTab === 'approved' ? 'aprovado' : 'rejeitado'}
            </h3>
            <p className="text-xs text-gray-400 font-sans max-w-sm">
              Não existem produtos com este estado de moderação.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE7FF]">
            {products.map(item => {
              const product = item.products;
              if (!product) return null;
              const img = productImage(item);
              const isProcessing = actionLoadingId === item.id;
              const isApproved = activeTab === 'approved';
              const isRejected = activeTab === 'rejected';

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-[#f8f7ff] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Product Image */}
                    <div className="shrink-0">
                      {img ? (
                        <img
                          src={img}
                          alt={product.title}
                          className="w-full lg:w-28 h-28 object-cover rounded-xl border border-gray-200"
                        />
                      ) : (
                        <div className="w-full lg:w-28 h-28 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-gray-800 truncate">{product.title}</h3>
                        <StatusBadge status={activeTab} />
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {getProductTypeLabel(product.type)}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-500 font-sans line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-sans">
                        <span className="flex items-center gap-1 font-bold text-gray-800">
                          <Euro className="w-3.5 h-3.5 text-gray-400" />
                          {formatPrice(product.price, product.is_free)}
                        </span>

                        {product.rating != null && product.rating > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {product.rating.toFixed(1)}
                            {product.total_reviews != null && product.total_reviews > 0 && (
                              <span className="text-gray-400 font-normal">({product.total_reviews})</span>
                            )}
                          </span>
                        )}

                        {product.total_sales != null && product.total_sales > 0 && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {product.total_sales} venda{product.total_sales !== 1 ? 's' : ''}
                          </span>
                        )}

                        {product.category_id && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Tags className="w-3.5 h-3.5" />
                            {product.categories?.name || '---'}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(product.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer w-full lg:w-auto"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => handleOpenReject(item)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer w-full lg:w-auto"
                          >
                            <X className="w-4 h-4" />
                            <span>Rejeitar</span>
                          </button>
                        </>
                      )}

                      {(isApproved || isRejected) && (
                        <button
                          onClick={() => handleOpenRemove(item)}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer w-full lg:w-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remover</span>
                        </button>
                      )}

                      {product.seller && (
                        <Link
                          href={`/admin/utilizadores/${product.seller.id}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#EDE7FF] text-[#4B187C] hover:bg-[#EDE7FF] text-xs font-bold transition-colors w-full lg:w-auto"
                        >
                          <Building2 className="w-4 h-4" />
                          <span className="truncate max-w-[100px]">{product.seller.full_name}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {isRejected && item.rejection_note && (
                    <div className="mt-3 pl-0 lg:pl-[132px]">
                      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Motivo da rejeição</span>
                        <p className="text-xs text-red-700 font-sans mt-0.5">{item.rejection_note}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={MODAL_CARD}>
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Rejeitar Produto
              </h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="text-xs text-gray-500">
                <p>Está prestes a rejeitar o produto <strong className="text-gray-800">{rejectingItem.products?.title}</strong>.</p>
                <p className="mt-1">O vendedor será notificado com o motivo da rejeição.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={e => {
                    setRejectionNote(e.target.value);
                    if (e.target.value.trim()) setRejectionError('');
                  }}
                  placeholder="Ex: O produto não cumpre as políticas da plataforma."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px] resize-y text-gray-800"
                />
                {rejectionError && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {rejectionError}
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === rejectingItem.id && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {removingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={MODAL_CARD}>
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Remover Produto
              </h3>
              <button
                onClick={() => setRemovingItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="text-xs text-gray-500">
                <p>Está prestes a remover o produto <strong className="text-gray-800">{removingItem.products?.title}</strong> da plataforma.</p>
                <p className="mt-1">O produto será desativado mas o seu histórico de encomendas e avaliações será preservado.</p>
                <p className="mt-1 font-bold text-red-600">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRemovingItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={actionLoadingId === removingItem.id}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === removingItem.id && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
