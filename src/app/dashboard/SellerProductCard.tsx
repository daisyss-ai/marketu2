'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ModerationStatus } from '@/types';

type SellerProduct = {
  id: string;
  title: string;
  price: number | string | null;
  is_free: boolean | null;
  is_active: boolean | null;
  preview_url: string | null;
  stock: number | null;
  moderation_status: ModerationStatus | string | null;
};

function formatPrice(isFree: boolean, price: number | string | null) {
  if (isFree) return 'Gratuito';
  const n = typeof price === 'number' ? price : Number(price ?? 0);
  return `${n.toLocaleString('pt-AO')} Kz`;
}

function statusBadge(status: string | null) {
  if (status === 'approved') return { label: 'Aprovado', cls: 'bg-green-100 text-green-700 border-green-200' };
  if (status === 'rejected') return { label: 'Rejeitado', cls: 'bg-red-100 text-red-700 border-red-200' };
  return { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
}

export default function SellerProductCard({ product }: { product: SellerProduct }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const badge = useMemo(() => statusBadge(product.moderation_status ? String(product.moderation_status) : null), [product.moderation_status]);

  const onToggleActive = async () => {
    try {
      setBusy(true);
      const next = !(product.is_active ?? false);
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao atualizar produto');
      toast.success(next ? 'Produto ativado' : 'Produto desativado');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar produto');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('Tem certeza que deseja apagar este produto?')) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao apagar produto');
      toast.success('Produto apagado');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao apagar produto');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={product.preview_url || '/assets/placeholder-product.png'}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.is_active ? 'bg-[#4B187C] text-white' : 'bg-gray-200 text-gray-700'}`}>
            {product.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="font-bold text-gray-900 line-clamp-2">{product.title}</div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-lg font-extrabold text-[#4B187C]">
            {formatPrice(!!product.is_free, product.price)}
          </div>
          <div className="text-xs font-semibold text-gray-600">
            Stock: <span className="text-gray-900">{product.stock ?? 0}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/dashboard/${product.id}/edit`}
            className={`flex-1 text-center px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 ${
              busy ? 'pointer-events-none opacity-70' : ''
            }`}
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-[#4B187C] text-[#4B187C] hover:bg-[#4B187C]/5 disabled:opacity-60"
          >
            {product.is_active ? 'Desativar' : 'Ativar'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

