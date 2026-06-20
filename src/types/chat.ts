import { Database } from './supabase'

// =============================================
// TIPOS BASE DAS TABELAS
// =============================================

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Dispute = Database['public']['Tables']['disputes']['Row']
export type DisputeInsert = Database['public']['Tables']['disputes']['Insert']
export type DisputeUpdate = Database['public']['Tables']['disputes']['Update']

// =============================================
// ENUMS
// =============================================

export type ConversationStatus = 'active' | 'closed' | 'blocked' | 'archived'
export type MessageType = 'text' | 'image' | 'offer' | 'system'
export type MessageStatus = 'sent' | 'delivered' | 'read'
export type DisputeStatus = 'open' | 'resolved' | 'cancelled' | 'frivolous'
export type DisputeResolution = 'cancelled' | 'seller_fault' | 'buyer_fault' | 'inconclusive'

// =============================================
// TIPOS ENRIQUECIDOS â€” com joins
// =============================================

export type MessageWithSender = Message & {
  sender: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export type ConversationWithDetails = Conversation & {
  product: {
    id: string
    title: string
    price: number
    product_media: { url: string; position: number }[]
  }
  buyer: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  seller: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  last_message: MessageWithSender | null
  unread_count: number
  active_dispute: DisputeWithDetails | null
  // Proposta ativa atual â€” null se nÃ£o houver nenhuma pendente
  active_offer: MessageWithSender | null
}

export type DisputeWithDetails = Dispute & {
  opened_by_profile: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

// =============================================
// PAYLOAD DE PROPOSTA â€” guardado no campo jsonb
// =============================================

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'superseded' | 'expired'

export type OfferPayload = {
  amount: number
  status: OfferStatus
}

export function getOfferPayload(message: Message): OfferPayload | null {
  if (message.type !== 'offer' || !message.payload) return null
  return message.payload as unknown as OfferPayload
}

// Verifica se uma proposta ainda estÃ¡ Ã  espera de resposta
export function isOfferPending(message: Message): boolean {
  const payload = getOfferPayload(message)
  return payload?.status === 'pending'
}

// =============================================
// HELPERS DE ESTADO DA CONVERSA
// =============================================

export function isConversationClosed(conversation: Conversation): boolean {
  return conversation.closed_by_buyer && conversation.closed_by_seller
}

export function isDisputeWindowOpen(conversation: Conversation): boolean {
  if (!isConversationClosed(conversation)) return false
  if (!conversation.last_message_at) return false
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return new Date(conversation.last_message_at) > sevenDaysAgo
}

export function canSendMessage(
  conversation: Conversation,
  userId: string
): boolean {
  return (
    conversation.status === 'active' &&
    (conversation.buyer_id === userId || conversation.seller_id === userId)
  )
}

export function canCloseConversation(
  conversation: Conversation,
  userId: string
): boolean {
  if (conversation.status !== 'active') return false
  if (conversation.buyer_id === userId) return !conversation.closed_by_buyer
  if (conversation.seller_id === userId) return !conversation.closed_by_seller
  return false
}

// Verifica se o utilizador atual Ã© o vendedor (Ãºnico que pode aceitar/recusar)
export function isSeller(
  conversation: Conversation,
  userId: string
): boolean {
  return conversation.seller_id === userId
}

// =============================================
// ESTADO DO CHAT â€” para os hooks
// =============================================

export type ChatState = {
  conversation: ConversationWithDetails | null
  messages: MessageWithSender[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  // Fase 2 â€” sugestÃµes de IA geradas ao abrir a conversa
  aiSuggestions: string[]
  suggestionsLoading: boolean
  suggestionsLimitReached: boolean
}

export type ConversationsListState = {
  conversations: ConversationWithDetails[]
  isLoading: boolean
  error: string | null
}

export type DisputeState = {
  dispute: DisputeWithDetails | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

// =============================================
// TIPOS PARA AÃ‡Ã•ES DO CHAT
// =============================================

export type SendMessageParams = {
  conversationId: string
  content: string
  type?: MessageType
  payload?: OfferPayload
}

export type StartConversationParams = {
  productId: string
  sellerId: string
  initialMessage: string
}

export type CloseConversationParams = {
  conversationId: string
  userId: string
}

export type OpenDisputeParams = {
  conversationId: string
  reason: string
}

export type SendOfferParams = {
  conversationId: string
  amount: number
}

export type RespondToOfferParams = {
  conversationId: string
  messageId: string
  response: 'accepted' | 'rejected'
}
