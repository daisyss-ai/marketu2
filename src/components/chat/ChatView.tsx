'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useChat } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ConversationProductCard from './ConversationProductCard'
import ConversationMenu from './ConversationMenu'
import AISuggestions from './AISuggestions'
import DisputeModal from './DisputeModal'
import OfferHistoryDrawer from './OfferHistoryDrawer'
import { canCloseConversation } from '@/types/chat'
import type { ConversationWithDetails, MessageWithSender } from '@/types/chat'

function NegotiationPill({ conversation }: { conversation: ConversationWithDetails | null }) {
  if (!conversation) return null

  const activeOffer = conversation.active_offer
  const offerStatus = activeOffer
    ? (activeOffer.payload as { status?: string } | null)?.status
    : null

  const offerMap = {
    pending:  { label: 'Proposta pendente', className: 'bg-amber-100 text-amber-800' },
    accepted: { label: 'Acordo fechado',    className: 'bg-green-100 text-green-800' },
    rejected: { label: 'Proposta recusada', className: 'bg-red-100 text-red-800' },
    expired:  { label: 'Proposta expirada', className: 'bg-gray-100 text-gray-500' },
  } as const satisfies Record<string, { label: string; className: string }>

  const convMap = {
    active:   { label: 'Em aberto',  className: 'bg-[#EDE7FF] text-[#4B187C]' },
    closed:   { label: 'Fechada',    className: 'bg-gray-100 text-gray-500' },
    blocked:  { label: 'Bloqueada',  className: 'bg-red-100 text-red-800' },
    archived: { label: 'Arquivada',  className: 'bg-gray-100 text-gray-500' },
  } as const satisfies Record<string, { label: string; className: string }>

  const cfg = (offerStatus && offerStatus in offerMap ? offerMap[offerStatus as keyof typeof offerMap] : null)
    ?? (conversation.status in convMap ? convMap[conversation.status as keyof typeof convMap] : null)
    ?? convMap.active

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 transition-colors ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

interface ChatViewProps {
  conversationId: string
  currentUserId: string
  initialConversation: ConversationWithDetails
  initialMessages: MessageWithSender[]
}

export default function ChatView({
  conversationId,
  currentUserId,
  initialConversation,
  initialMessages,
}: ChatViewProps) {
  const {
    conversation,
    messages,
    isLoading,
    isSending,
    markAsRead,
    respondToOffer,
    sendMessage,
    sendImage,
    sendOffer,
    closeDeal,
    deleteConversation,
    blockUser,
    unblockUser,
    checkIsBlockedByOther,
    openDispute,
    getDispute,
    aiSuggestions,
    suggestionsLoading,
    suggestionsLimitReached,
  } = useChat(conversationId)

  const bottomRef = useRef<HTMLDivElement>(null)
  const openOfferPanelRef = useRef<(() => void) | null>(null)
  const [isBlockedByOther, setIsBlockedByOther] = useState(false)
  const [isClosingDeal, setIsClosingDeal] = useState(false)
  const [offerHistoryOpen, setOfferHistoryOpen] = useState(false)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [existingDispute, setExistingDispute] = useState<{
    status: string
    reason: string
    resolution: string | null
  } | null>(null)

  const activeConversation = conversation ?? initialConversation
  const activeMessages = messages.length > 0 ? messages : initialMessages
  const latestMessage = activeMessages[activeMessages.length - 1]
  const isBuyer = activeConversation.buyer_id === currentUserId
  const isSeller = activeConversation.seller_id === currentUserId

  const isBlocked = activeConversation.status === 'blocked'
  const showAISuggestions =
    activeConversation.status === 'active' &&
    (!latestMessage || latestMessage.sender.id !== currentUserId)

  const otherUser = activeConversation.buyer.id === currentUserId
    ? activeConversation.seller
    : activeConversation.buyer

  useEffect(() => {
    markAsRead()
  }, [activeMessages.length, markAsRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  // Verificar se EU sou quem foi bloqueado sempre que o status mudar
  useEffect(() => {
    if (isBlocked) {
      checkIsBlockedByOther().then(setIsBlockedByOther)
    } else {
      setIsBlockedByOther(false)
    }
  }, [isBlocked, checkIsBlockedByOther])

  function handleSuggestionSelect(suggestion: string) {
    void sendMessage(suggestion)
  }

  // Abrir o modal — busca disputa existente primeiro (se houver, mostra estado em vez do form)
  async function handleOpenDisputeModal() {
    const dispute = await getDispute()
    setExistingDispute(dispute)
    setDisputeModalOpen(true)
  }

  async function handleSubmitDispute(reason: string) {
    const result = await openDispute(reason)
    return result
  }

  // Quem bloqueou pode desbloquear; quem foi bloqueado não
  const isBlockedByMe = isBlocked && !isBlockedByOther

  // Input desativado se a conversa não está ativa OU se eu fui bloqueado
  const inputDisabled = activeConversation.status !== 'active' || isBlockedByOther

  // Pode fechar negócio se houver mensagens de ambos e ainda não confirmou
  const hasMessagesFromBoth = activeMessages.some(m => m.sender.id === currentUserId)
    && activeMessages.some(m => m.sender.id !== currentUserId)
  const canShowCloseButton = hasMessagesFromBoth && canCloseConversation(activeConversation, currentUserId)

  async function handleCloseDeal() {
    setIsClosingDeal(true)
    await closeDeal()
    setIsClosingDeal(false)
  }

  return (
    <main className="flex flex-col flex-1 h-full min-w-0">

      {/* Cabeçalho */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[#EDE7FF] shrink-0 bg-white">
        <Link
          href="/chat"
          className="md:hidden text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          aria-label="Voltar à lista"
        >
          ←
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#EDE7FF] flex items-center justify-center text-sm font-semibold text-[#4B187C] shrink-0 overflow-hidden">
          {otherUser.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
          ) : (
            otherUser.full_name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{otherUser.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{activeConversation.product.title}</p>
        </div>

        {/* Pill + Botão fechar + Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {canShowCloseButton && (
            <button
              onClick={handleCloseDeal}
              disabled={isClosingDeal}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#4B187C] text-white hover:bg-[#3a1260] disabled:opacity-50 transition-colors"
            >
              {isClosingDeal ? 'A confirmar…' : '🤝 Fechar negócio'}
            </button>
          )}
          <NegotiationPill conversation={activeConversation} />
          <ConversationMenu
            conversationId={conversationId}
            isBlocked={isBlocked}
            isBlockedByMe={isBlockedByMe}
            onViewOfferHistory={() => setOfferHistoryOpen(true)}
            onDeleteConversation={deleteConversation}
            onBlockUser={blockUser}
            onUnblockUser={unblockUser}
          />
        </div>
      </header>

      {/* Aviso de bloqueio — visível para quem foi bloqueado */}
      {isBlockedByOther && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 text-center">
          <p className="text-xs text-red-600">
            Não podes enviar mensagens nesta conversa.
          </p>
        </div>
      )}

      {/* Card do produto */}
      <ConversationProductCard
        conversation={activeConversation}
        currentUserId={currentUserId}
        onMakeOffer={sendOffer}
        onOpenPanelRef={openOfferPanelRef}
      />

      {/* Mensagens */}
      <section className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[#FAFAFA]">
        {isLoading && activeMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-[#4B187C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-12 h-12 rounded-full bg-[#EDE7FF] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4B187C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
            <p className="text-xs text-gray-400">Inicia a conversa!</p>
          </div>
        ) : (
          <>
            {activeMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender.id === currentUserId}
                isSeller={isSeller}
                conversationId={conversationId}
                originalPrice={activeConversation.product.price}
                onRespond={respondToOffer}
                onOpenDispute={handleOpenDisputeModal}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </section>

      {/* Sugestões de IA */}
      {showAISuggestions && (suggestionsLoading || suggestionsLimitReached || aiSuggestions.length > 0) && (
        <AISuggestions
          suggestions={aiSuggestions}
          isLoading={suggestionsLoading}
          limitReached={suggestionsLimitReached}
          onSelect={handleSuggestionSelect}
        />
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-[#EDE7FF] px-4 py-3 bg-white">
        <MessageInput
          conversationId={conversationId}
          currentUserId={currentUserId}
          disabled={inputDisabled}
          isSending={isSending}
          isBuyer={isBuyer}
          onSendMessage={sendMessage}
          onSendImage={sendImage}
          onMakeOffer={isBuyer ? () => openOfferPanelRef.current?.() : undefined}
        />
      </div>

      {/* Modal de disputa */}
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        onSubmit={handleSubmitDispute}
        existingDispute={existingDispute}
      />

      {/* Gaveta de histórico de propostas */}
      <OfferHistoryDrawer
        isOpen={offerHistoryOpen}
        onClose={() => setOfferHistoryOpen(false)}
        offers={activeMessages.filter(m => m.type === 'offer')}
        currentUserId={currentUserId}
        originalPrice={activeConversation.product.price}
      />
    </main>
  )
}