'use client'

import { useRouter } from 'next/navigation'
import { useStartConversation } from '@/hooks/useChat'

interface ContactSellerButtonProps {
  productId: string
  sellerId: string
  currentUserId: string | null
  className?: string
}

export default function ContactSellerButton({
  productId,
  sellerId,
  currentUserId,
  className = '',
}: ContactSellerButtonProps) {
  const router = useRouter()
  const { startConversation, isLoading } = useStartConversation()

  const isOwnProduct = currentUserId === sellerId

  async function handleClick() {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    if (isOwnProduct) return

    const { conversationId, error } = await startConversation(productId, sellerId)

    if (error || !conversationId) {
      // Erro silencioso — não bloqueia a navegação, mas evita redirecionar para conversa inexistente
      console.error('Erro ao iniciar conversa:', error)
      return
    }

    router.push(`/chat/${conversationId}`)
  }

  if (isOwnProduct) {
    return (
      <button
        disabled
        className={`mt-2 w-full rounded-full bg-gray-100 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed ${className}`}
      >
        Este é o teu produto
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`mt-2 w-full rounded-full bg-[#4B187C] py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#3E1367] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          A abrir conversa…
        </span>
      ) : (
        'Contatar vendedor'
      )}
    </button>
  )
}