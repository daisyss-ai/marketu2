'use client'

import { useState, useRef, useEffect, MutableRefObject } from 'react'
import type { ConversationWithDetails } from '@/types/chat'

interface ConversationProductCardProps {
  conversation: ConversationWithDetails
  currentUserId: string
  onMakeOffer?: (amount: number) => Promise<{ error: string | null } | undefined>
  onOpenPanelRef?: MutableRefObject<(() => void) | null>
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function ConversationProductCard({
  conversation,
  currentUserId,
  onMakeOffer,
  onOpenPanelRef,
}: ConversationProductCardProps) {
  const { product } = conversation
  const isBuyer = conversation.buyer_id === currentUserId
  const [showOfferPanel, setShowOfferPanel] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewImage = product.product_media?.find((m: any) => m.is_preview)?.url
    ?? product.product_media?.[0]?.url
    ?? null

  const activeOffer = conversation.active_offer
  const offerPayload = activeOffer
    ? (activeOffer.payload as { status?: string; amount?: number } | null)
    : null

  const offerStatus = offerPayload?.status
  const hasPendingOffer = offerStatus === 'pending'
  const hasAcceptedOffer = offerStatus === 'accepted'
  const hasRejectedOffer = offerStatus === 'rejected'

  // Mostrar botão se: comprador, conversa activa, sem proposta pendente ou aceite
  const showOfferButton = isBuyer
    && conversation.status === 'active'
    && !hasPendingOffer
    && !hasAcceptedOffer
    && !showOfferPanel
    && !!onMakeOffer

  function openOfferPanel() {
    setShowOfferPanel(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeOfferPanel() {
    setShowOfferPanel(false)
    setOfferAmount('')
  }

  useEffect(() => {
    if (onOpenPanelRef) onOpenPanelRef.current = openOfferPanel
  }, [onOpenPanelRef])

  async function handleSendOffer() {
    const amount = parseFloat(offerAmount.replace(/\s/g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0 || !onMakeOffer) return
    setIsSending(true)
    await onMakeOffer(amount)
    setIsSending(false)
    closeOfferPanel()
  }

  return (
    <div className={[
      'shrink-0 border-b bg-white px-4 py-3 transition-colors',
      hasAcceptedOffer ? 'border-green-200 bg-green-50' : 'border-[#EDE7FF]',
    ].join(' ')}>
      <div className="flex items-center gap-3">

        {/* Thumbnail */}
        <a
          href={`/products/${product.id}`}
          className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[#F5F0FF] border border-[#EDE7FF] hover:opacity-90 transition-opacity"
        >
          {previewImage ? (
            <img src={previewImage} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C4B0E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.466-7.59a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
          )}
        </a>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <a
            href={`/products/${product.id}`}
            className="block text-sm font-semibold text-gray-900 truncate hover:text-[#4B187C] transition-colors"
          >
            {product.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">

            {/* Preço original */}
            <span className={[
              'text-sm font-bold',
              hasPendingOffer || hasAcceptedOffer ? 'text-gray-400 line-through' : 'text-[#4B187C]',
            ].join(' ')}>
              {formatPrice(product.price)}
            </span>

            {/* Valor da proposta */}
            {(hasPendingOffer || hasAcceptedOffer) && offerPayload?.amount && (
              <span className={[
                'text-sm font-bold',
                hasAcceptedOffer ? 'text-green-700' : 'text-amber-600',
              ].join(' ')}>
                {formatPrice(offerPayload.amount)}
              </span>
            )}

            {/* Badge de estado */}
            {hasPendingOffer && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Proposta pendente
              </span>
            )}
            {hasAcceptedOffer && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                ✅ Acordo fechado
              </span>
            )}
            {hasRejectedOffer && isBuyer && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                Proposta recusada
              </span>
            )}
          </div>
        </div>

        {/* Botão propor preço */}
        {showOfferButton && (
          <button
            onClick={openOfferPanel}
            className="shrink-0 text-xs font-semibold text-[#4B187C] border border-[#4B187C] rounded-lg px-3 py-1.5 hover:bg-[#4B187C] hover:text-white transition-colors"
          >
            {hasRejectedOffer ? 'Nova proposta' : 'Propor preço'}
          </button>
        )}

        {/* Estado conversa inactiva */}
        {conversation.status !== 'active' && (
          <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            {conversation.status === 'closed' ? 'Fechada' : 'Arquivada'}
          </span>
        )}
      </div>

      {/* Painel de proposta */}
      {showOfferPanel && (
        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <span className="text-sm text-amber-700 font-medium shrink-0">Proposta:</span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            placeholder="Valor em Kz"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOffer()}
            className="flex-1 bg-transparent text-sm text-amber-900 placeholder:text-amber-400 focus:outline-none"
          />
          <button onClick={closeOfferPanel} className="text-amber-400 hover:text-amber-600 transition-colors text-xs shrink-0">
            Cancelar
          </button>
          <button
            onClick={handleSendOffer}
            disabled={!offerAmount || isSending}
            className="px-3 py-1 bg-[#4B187C] text-white text-xs font-semibold rounded-lg hover:bg-[#3a1260] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isSending ? '…' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  )
}