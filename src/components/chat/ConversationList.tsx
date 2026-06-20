'use client'

import { useState } from 'react'
import { useConversations } from '@/hooks/useChat'
import ConversationItem from './ConversationItem'
import type { ConversationWithDetails } from '@/types/chat'

interface ConversationListProps {
  conversations: ConversationWithDetails[] // dados iniciais do servidor (SSR)
  currentUserId: string
  activeId?: string
}

export default function ConversationList({
  conversations: initialConversations,
  currentUserId,
  activeId,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  // ← Usar hook para dados em tempo real (unread_count, last_message, etc.)
  // Enquanto carrega, usa os dados iniciais do servidor
  const { conversations: liveConversations, isLoading } = useConversations()
  const conversations = liveConversations.length > 0 ? liveConversations : initialConversations

  const filtered = conversations.filter((conv) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const otherUser = conv.buyer.id === currentUserId ? conv.seller : conv.buyer
    return (
      otherUser.full_name.toLowerCase().includes(q) ||
      conv.product.title.toLowerCase().includes(q)
    )
  })

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0)

  return (
    <div className="flex flex-col h-full">

      {/* Cabeçalho */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Mensagens</h2>
          {totalUnread > 0 && (
            <span className="text-xs bg-[#4B187C] text-white font-bold px-2 py-0.5 rounded-full">
              {totalUnread} {totalUnread === 1 ? 'nova' : 'novas'}
            </span>
          )}
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F9F7FF] border border-[#EDE7FF] rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B187C]/20 focus:border-[#4B187C] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            {search ? (
              <>
                <p className="text-sm font-medium text-gray-600">Sem resultados</p>
                <p className="text-xs text-gray-400 mt-1">
                  Nenhuma conversa com &ldquo;{search}&rdquo;
                </p>
              </>
            ) : isLoading ? (
              <div className="w-5 h-5 border-2 border-[#4B187C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#EDE7FF] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-[#4B187C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Sem conversas ainda</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contacta um vendedor para começar
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUserId={currentUserId}
              isActive={conv.id === activeId}
            />
          ))
        )}
      </div>
    </div>
  )
}