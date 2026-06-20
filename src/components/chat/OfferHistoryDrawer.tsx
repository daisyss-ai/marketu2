'use client'

import { useEffect } from 'react'
import type { MessageWithSender, OfferPayload } from '@/types/chat'
import { getOfferPayload } from '@/types/chat'

// =============================================
// HELPERS
// =============================================

function formatKz(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  pending:    { label: 'Pendente',   className: 'bg-amber-100 text-amber-700',  icon: '⏳' },
  accepted:   { label: 'Aceite',     className: 'bg-green-100 text-green-700',  icon: '✅' },
  rejected:   { label: 'Recusada',   className: 'bg-red-100 text-red-600',      icon: '❌' },
  superseded: { label: 'Substituída', className: 'bg-gray-100 text-gray-500',   icon: '↻' },
  expired:    { label: 'Expirada',   className: 'bg-gray-100 text-gray-400',    icon: '⏱' },
}

// =============================================
// PROPS
// =============================================

interface OfferHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  offers: MessageWithSender[]
  currentUserId: string
  originalPrice: number
}

// =============================================
// COMPONENTE
// =============================================

export default function OfferHistoryDrawer({
  isOpen,
  onClose,
  offers,
  currentUserId,
  originalPrice,
}: OfferHistoryDrawerProps) {

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Ordenar mais recente primeiro
  const sortedOffers = [...offers].sort((a, b) =>
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col animate-slide-in-right">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#EDE7FF] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Histórico de propostas</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {offers.length} {offers.length === 1 ? 'proposta' : 'propostas'} nesta conversa
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F9F7FF]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {sortedOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#EDE7FF] flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-sm text-gray-500">Sem propostas ainda</p>
              <p className="text-xs text-gray-400">As propostas feitas nesta conversa aparecem aqui</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedOffers.map((offer) => {
                const payload = getOfferPayload(offer) as OfferPayload | null
                if (!payload) return null

                const isMine = offer.sender.id === currentUserId
                const cfg = STATUS_CONFIG[payload.status] ?? STATUS_CONFIG.pending
                const discount = originalPrice > 0
                  ? Math.round(((originalPrice - payload.amount) / originalPrice) * 100)
                  : 0

                return (
                  <div
                    key={offer.id}
                    className="border border-gray-100 rounded-xl p-3.5"
                  >
                    {/* Topo: quem propôs + estado */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {isMine ? 'A tua proposta' : offer.sender.full_name}
                      </span>
                      <span className={[
                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                        cfg.className,
                      ].join(' ')}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatKz(payload.amount)}
                      </span>
                      {discount !== 0 && (
                        <span className={[
                          'text-xs font-medium',
                          discount > 0 ? 'text-green-600' : 'text-red-500',
                        ].join(' ')}>
                          {discount > 0 ? `-${discount}%` : `+${Math.abs(discount)}%`}
                        </span>
                      )}
                    </div>

                    {/* Hora */}
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {formatDateTime(offer.created_at)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}