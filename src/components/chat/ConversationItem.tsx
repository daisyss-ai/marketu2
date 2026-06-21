'use client'

import Link from 'next/link'
import type { ConversationWithDetails } from '@/types/chat'

// =============================================
// HELPERS
// =============================================

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

function messagePreview(conv: ConversationWithDetails): string {
  const msg = conv.last_message
  if (!msg) return 'Sem mensagens ainda'
  if (msg.type === 'offer') return '💰 Proposta enviada'
  if (msg.type === 'system') return '⚙️ Mensagem do sistema'
  if (msg.type === 'image') return '📷 Imagem'
  return msg.content.length > 45 ? msg.content.slice(0, 45) + '…' : msg.content
}

// =============================================
// PROPS
// =============================================

interface ConversationItemProps {
  conversation: ConversationWithDetails
  currentUserId: string
  isActive?: boolean
}

// =============================================
// COMPONENTE
// =============================================

export default function ConversationItem({
  conversation: conv,
  currentUserId,
  isActive = false,
}: ConversationItemProps) {
  const otherUser = conv.buyer.id === currentUserId ? conv.seller : conv.buyer
  const preview = messagePreview(conv)
  const time = timeAgo(conv.last_message_at)
  const hasUnread = conv.unread_count > 0
  const hasPendingOffer = !!conv.active_offer

  // Thumbnail do produto
  const previewImage = conv.product.product_media?.find((m: any) => m.is_preview)?.url
    ?? conv.product.product_media?.[0]?.url
    ?? null

  // Avatar do outro utilizador
  const initial = otherUser.full_name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/chat/${conv.id}`}
      className={[
        'flex items-center gap-3 px-4 py-3 transition-colors rounded-xl mx-2',
        isActive ? 'bg-[#EDE7FF]' : 'hover:bg-[#F9F7FF]',
      ].join(' ')}
    >
      {/* Avatar do utilizador + thumbnail do produto sobrepostos */}
      <div className="relative shrink-0 w-11 h-11">
        {/* Thumbnail do produto — fundo */}
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F5F0FF] border border-[#EDE7FF]">
          {previewImage ? (
            <img
              src={previewImage}
              alt={conv.product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#C4B0E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.466-7.59a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Avatar do utilizador — canto inferior direito */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#EDE7FF] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#4B187C] overflow-hidden">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">

        {/* Linha 1 — nome + hora */}
        <div className="flex items-center justify-between gap-2">
          <span className={[
            'text-sm truncate',
            hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
          ].join(' ')}>
            {otherUser.full_name}
          </span>
          <span className="text-[11px] text-gray-400 shrink-0">{time}</span>
        </div>

        {/* Linha 2 — nome do produto */}
        <span className="text-[11px] text-[#4B187C]/70 truncate block mt-0.5">
          {conv.product.title}
        </span>

        {/* Linha 3 — preview + badges */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={[
            'text-xs truncate',
            hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400',
          ].join(' ')}>
            {preview}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {hasPendingOffer && !hasUnread && (
              <span className="text-[10px] bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full">
                Proposta
              </span>
            )}
            {hasUnread && (
              <span className="min-w-4.5 h-4.5 px-1 bg-[#4B187C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {conv.unread_count > 99 ? '99+' : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}