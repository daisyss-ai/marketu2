'use client'

import type { MessageWithSender } from '@/types/chat'
import { getOfferPayload } from '@/types/chat'
import OfferCard from './OfferCard'

// =============================================
// HELPERS
// =============================================

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') {
    return (
      <svg className="w-3.5 h-3.5 text-[#4B187C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l4 4 4-4m4-8l-4 4-4-4" />
      </svg>
    )
  }
  if (status === 'delivered') {
    return (
      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l4 4 4-4m4-8l-4 4-4-4" />
      </svg>
    )
  }
  return (
    <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// Deteta se esta mensagem de sistema deve mostrar o link de disputa
function isDealClosedMessage(content: string): boolean {
  return content.includes('Negócio confirmado')
}

function isDisputeOpenedMessage(content: string): boolean {
  return content.includes('Disputa aberta')
}

// =============================================
// PROPS
// =============================================

interface MessageBubbleProps {
  message: MessageWithSender
  isMine: boolean
  conversationId: string
  originalPrice?: number
  isSeller?: boolean
  onRespond?: (messageId: string, response: 'accepted' | 'rejected') => Promise<{ error: string | null } | undefined>
  onOpenDispute?: () => void
}

// =============================================
// COMPONENTE
// =============================================

export default function MessageBubble({
  message,
  isMine,
  originalPrice,
  isSeller = false,
  onRespond,
  onOpenDispute,
}: MessageBubbleProps) {

  // ── Mensagem de sistema ──────────────────────────────────────────────────
  if (message.type === 'system') {
    const showDisputeLink = isDealClosedMessage(message.content) && onOpenDispute
    const showDisputeStatus = isDisputeOpenedMessage(message.content)

    return (
      <div className="flex flex-col items-center my-2 gap-1.5">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full max-w-xs text-center">
          {message.content}
        </span>

        {/* Link para abrir disputa — só na mensagem de negócio confirmado */}
        {showDisputeLink && (
          <button
            onClick={onOpenDispute}
            className="text-xs font-medium text-[#4B187C] hover:underline"
          >
            Abrir disputa
          </button>
        )}

        {/* Indicador visual quando a disputa já foi aberta */}
        {showDisputeStatus && (
          <button
            onClick={onOpenDispute}
            className="text-xs font-medium text-amber-600 hover:underline"
          >
            Ver estado da disputa
          </button>
        )}
      </div>
    )
  }

  // ── Proposta ─────────────────────────────────────────────────────────────
  if (message.type === 'offer') {
    const offerPayload = getOfferPayload(message)
    if (!offerPayload) return null
    return (
      <div className={['flex', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
        <OfferCard
          message={message}
          payload={offerPayload}
          isMine={isMine}
          isSeller={isSeller}
          originalPrice={originalPrice}
          onRespond={onRespond ?? (async () => ({ error: null }))}
        />
      </div>
    )
  }

  // ── Imagem ───────────────────────────────────────────────────────────────
  if (message.type === 'image') {
    return (
      <div className={['flex gap-2', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
        {!isMine && (
          <div className="w-7 h-7 rounded-full bg-[#EDE7FF] flex items-center justify-center text-xs font-semibold text-[#4B187C] shrink-0 self-end">
            {message.sender.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="max-w-[280px]">
          <div className={[
            'rounded-2xl overflow-hidden',
            isMine ? 'rounded-br-sm' : 'rounded-bl-sm',
          ].join(' ')}>
            <img
              src={message.content}
              alt="Imagem enviada"
              className="w-full object-cover max-h-64"
            />
          </div>
          <div className={['flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
            <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
            {isMine && <StatusIcon status={message.status ?? 'sent'} />}
          </div>
        </div>
      </div>
    )
  }

  // ── Texto ────────────────────────────────────────────────────────────────
  return (
    <div className={['flex gap-2 items-end', isMine ? 'justify-end' : 'justify-start'].join(' ')}>

      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-[#EDE7FF] flex items-center justify-center text-xs font-semibold text-[#4B187C] shrink-0">
          {message.sender.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt={message.sender.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            message.sender.full_name.charAt(0).toUpperCase()
          )}
        </div>
      )}

      <div className="max-w-[70%] flex flex-col">
        <div className={[
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap',
          isMine
            ? 'bg-[#4B187C] text-white rounded-br-sm'
            : 'bg-white border border-[#EDE7FF] text-gray-800 rounded-bl-sm shadow-sm',
        ].join(' ')}>
          {message.content}
        </div>

        <div className={['flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
          <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
          {isMine && <StatusIcon status={message.status ?? 'sent'} />}
        </div>
      </div>
    </div>
  )
}