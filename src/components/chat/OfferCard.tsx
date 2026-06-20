'use client'

import { useState } from 'react'
import type { MessageWithSender, OfferPayload } from '@/types/chat'

interface OfferCardProps {
  message: MessageWithSender
  payload: OfferPayload
  isMine: boolean
  isSeller: boolean
  originalPrice?: number
  onRespond: (messageId: string, response: 'accepted' | 'rejected') => Promise<{ error: string | null } | undefined>
}

function formatKz(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount)
}

function discountLabel(offer: number, original: number): string {
  const pct = Math.round(((original - offer) / original) * 100)
  if (pct > 0) return `-${pct}%`
  if (pct < 0) return `+${Math.abs(pct)}%`
  return 'Preço original'
}

function getStatusConfig(status: OfferPayload['status']) {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', icon: '⏳', containerClass: 'border-amber-200 bg-amber-50', labelClass: 'text-amber-600 bg-amber-100', amountClass: 'text-amber-800' }
    case 'accepted':
      return { label: 'Aceite', icon: '✅', containerClass: 'border-green-200 bg-green-50', labelClass: 'text-green-700 bg-green-100', amountClass: 'text-green-800' }
    case 'rejected':
      return { label: 'Recusada', icon: '✕', containerClass: 'border-red-100 bg-red-50', labelClass: 'text-red-500 bg-red-100', amountClass: 'text-red-700' }
    case 'superseded':
      return { label: 'Substituída', icon: '↩', containerClass: 'border-gray-200 bg-gray-50', labelClass: 'text-gray-400 bg-gray-100', amountClass: 'text-gray-400' }
    case 'expired':
      return { label: 'Expirada', icon: '⌛', containerClass: 'border-gray-200 bg-gray-50', labelClass: 'text-gray-400 bg-gray-100', amountClass: 'text-gray-400' }
    default:
      return { label: '', icon: '', containerClass: 'border-gray-200 bg-gray-50', labelClass: 'text-gray-400 bg-gray-100', amountClass: 'text-gray-400' }
  }
}

export default function OfferCard({
  message, payload, isMine, isSeller, onRespond, originalPrice,
}: OfferCardProps) {
  const [isResponding, setIsResponding] = useState(false)
  const cfg = getStatusConfig(payload.status)
  const isInactive = payload.status === 'superseded' || payload.status === 'expired'

  // Só o vendedor pode aceitar/recusar, e só se não foi ele a enviar
  const canRespond = isSeller && !isMine && payload.status === 'pending'

  async function handleRespond(response: 'accepted' | 'rejected') {
    setIsResponding(true)
    await onRespond(message.id, response)
    setIsResponding(false)
  }

  return (
    <div className={[
      'border rounded-2xl p-4 w-full max-w-65 transition-opacity',
      cfg.containerClass,
      isInactive ? 'opacity-60' : '',
    ].join(' ')}>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500">
          {isMine ? 'A tua proposta' : 'Proposta recebida'}
        </span>
        <span className={['text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', cfg.labelClass].join(' ')}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Valor */}
      <div className="mb-4">
        <p className={['text-2xl font-bold tracking-tight', cfg.amountClass].join(' ')}>
          {formatKz(payload.amount)}
        </p>
        {originalPrice && originalPrice !== payload.amount && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 line-through">{formatKz(originalPrice)}</span>
            <span className={['text-xs font-semibold', payload.amount < originalPrice ? 'text-green-600' : 'text-red-500'].join(' ')}>
              {discountLabel(payload.amount, originalPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Botões — só vendedor, só quando pendente */}
      {canRespond && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handleRespond('accepted')}
            disabled={isResponding}
            className="flex-1 py-2 text-xs font-semibold bg-[#4B187C] text-white rounded-xl hover:bg-[#3a1260] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResponding ? '…' : 'Aceitar'}
          </button>
          <button
            onClick={() => handleRespond('rejected')}
            disabled={isResponding}
            className="flex-1 py-2 text-xs font-semibold bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Recusar
          </button>
        </div>
      )}

      {/* Hora */}
      <p className="text-[10px] text-gray-400 text-right">
        {message.created_at
          ? new Date(message.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
          : ''}
      </p>
    </div>
  )
}