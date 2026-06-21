import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getChatSuggestions } from '@/app/actions/chat-suggestions'
import { getCachedUserId } from './useCurrentUser'
import type {
  ChatState,
  ConversationsListState,
  Conversation,
  ConversationWithDetails,
  MessageWithSender,
  MessageType,
  OfferPayload,
} from '@/types/chat'

const supabase = createClient()

const MESSAGE_WITH_SENDER = `
  *,
  sender:users!sender_id (
    id,
    full_name,
    avatar_url
  )
` as const

// =============================================
// HOOK — lista de conversas
// =============================================

export function useConversations() {
  const [state, setState] = useState<ConversationsListState>({
    conversations: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    const fetchConversations = async () => {
      const userId = await getCachedUserId()
      if (!userId) return

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          product:products!product_id (
            id,
            title,
            price,
            product_media ( url, position )
          ),
          buyer:conversations_buyer_id_fkey ( id, full_name, avatar_url ),
          seller:conversations_seller_id_fkey ( id, full_name, avatar_url )
        `)
        .order('last_message_at', { ascending: false })

      if (!mounted) return

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return
      }

      const enriched = await Promise.all(
        (data ?? []).map(async (conv: { id: string; [key: string]: any }) => {
          const [lastMsgResult, unreadResult] = await Promise.all([
            supabase
              .from('messages')
              .select(MESSAGE_WITH_SENDER)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId)
              .is('status', 'sent'),
          ])

          return {
            ...(conv as any),
            last_message: lastMsgResult.data ?? null,
            unread_count: unreadResult.count ?? 0,
            active_dispute: null,
            active_offer: null,
          } as ConversationWithDetails
        })
      )

      setState({ conversations: enriched, isLoading: false, error: null })
    }

    fetchConversations()

    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => fetchConversations())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => fetchConversations())
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return state
}

// =============================================
// HOOK — conversa individual com mensagens
// =============================================

export function useChat(conversationId: string) {
  const [state, setState] = useState<ChatState>({
    conversation: null,
    messages: [],
    isLoading: true,
    isSending: false,
    error: null,
    aiSuggestions: [],
    suggestionsLoading: false,
    suggestionsLimitReached: false,
  })

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const currentUserIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)

  // ── Sugestões de IA ───────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async () => {
    const userId = await getCachedUserId()
    if (!userId) return

    currentUserIdRef.current = userId
    setState(prev => ({ ...prev, suggestionsLoading: true }))

    const { suggestions, limitReached } = await getChatSuggestions(conversationId, userId)

    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      aiSuggestions: limitReached ? [] : suggestions,
      suggestionsLoading: false,
      suggestionsLimitReached: limitReached,
    }))
  }, [conversationId])

  // ── Carregar conversa + mensagens + realtime ─────────────────────────────

  useEffect(() => {
    if (!conversationId) return
    mountedRef.current = true

    const fetchData = async () => {
      const userId = await getCachedUserId()
      if (userId) currentUserIdRef.current = userId

      const [convResult, messagesResult] = await Promise.all([
        supabase
          .from('conversations')
          .select(`
            *,
            product:products!product_id (
              id,
              title,
              price,
              product_media ( url, position )
            ),
            buyer:conversations_buyer_id_fkey ( id, full_name, avatar_url ),
            seller:conversations_seller_id_fkey ( id, full_name, avatar_url )
          `)
          .eq('id', conversationId)
          .single(),
        supabase
          .from('messages')
          .select(MESSAGE_WITH_SENDER)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
      ])

      if (!mountedRef.current) return

      if (convResult.error || messagesResult.error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: convResult.error?.message ?? messagesResult.error?.message ?? 'Erro desconhecido',
        }))
        return
      }

      setState({
        conversation: {
          ...(convResult.data as any),
          last_message: null,
          unread_count: 0,
          active_dispute: null,
          active_offer: null,
        } as ConversationWithDetails,
        messages: (messagesResult.data ?? []) as MessageWithSender[],
        isLoading: false,
        isSending: false,
        error: null,
        aiSuggestions: [],
        suggestionsLoading: false,
        suggestionsLimitReached: false,
      })
    }

    fetchData()

    channelRef.current = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select(MESSAGE_WITH_SENDER)
          .eq('id', payload.new.id)
          .single()

        if (data && mountedRef.current) {
          setState(prev => {
            const alreadyExists = prev.messages.some(m => m.id === (data as MessageWithSender).id)
            if (alreadyExists) return prev
            return {
              ...prev,
              messages: [...prev.messages, data as MessageWithSender],
            }
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        if (!mountedRef.current) return
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m =>
            m.id === payload.new.id ? { ...m, ...payload.new } : m
          ),
        }))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      }, (payload) => {
        if (!mountedRef.current) return
        setState(prev => ({
          ...prev,
          conversation: prev.conversation
            ? { ...prev.conversation, ...payload.new }
            : prev.conversation,
        }))
      })
      .subscribe()

    return () => {
      mountedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [conversationId])

  // ── Trigger automático de sugestões quando chega mensagem de outro ───────

  const lastMessage = state.messages[state.messages.length - 1]
  const lastMessageId = lastMessage?.id
  const lastMessageSenderId = lastMessage?.sender.id
  const conversationStatus = state.conversation?.status

  useEffect(() => {
    if (conversationStatus !== 'active') return

    if (!lastMessage) {
      window.setTimeout(() => { void fetchSuggestions() }, 0)
      return
    }

    const currentUserId = currentUserIdRef.current
    if (!currentUserId) return

    if (lastMessageSenderId !== currentUserId) {
      window.setTimeout(() => { void fetchSuggestions() }, 0)
    }
  }, [conversationStatus, fetchSuggestions, lastMessage, lastMessageId, lastMessageSenderId])

  // ── Enviar mensagem de texto ──────────────────────────────────────────────

  const sendMessage = useCallback(async (
    content: string,
    type: MessageType = 'text',
    offerPayload?: OfferPayload
  ) => {
    const userId = await getCachedUserId()
    if (!userId) return { error: 'Não autenticado' }

    setState(prev => ({ ...prev, isSending: true }))

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        type,
        status: 'sent',
        ...(offerPayload && { payload: offerPayload }),
      })
      .select(MESSAGE_WITH_SENDER)
      .single()

    if (error) {
      setState(prev => ({ ...prev, isSending: false }))
      return { error: error.message }
    }

    if (newMessage) {
      setState(prev => ({
        ...prev,
        isSending: false,
        messages: [...prev.messages, newMessage as MessageWithSender],
      }))
    } else {
      setState(prev => ({ ...prev, isSending: false }))
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return { error: null }
  }, [conversationId])

  // ── Enviar imagem ─────────────────────────────────────────────────────────

  const sendImage = useCallback(async (file: File) => {
    const userId = await getCachedUserId()
    if (!userId) return { error: 'Não autenticado' }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Formato não suportado. Usa JPG, PNG ou WebP.' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Imagem demasiado grande. Máximo 5 MB.' }
    }

    setState(prev => ({ ...prev, isSending: true }))

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${conversationId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setState(prev => ({ ...prev, isSending: false }))
      return { error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(path)

    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: publicUrl,
        type: 'image',
        status: 'sent',
      })
      .select(MESSAGE_WITH_SENDER)
      .single()

    if (msgError) {
      setState(prev => ({ ...prev, isSending: false }))
      return { error: msgError.message }
    }

    if (newMessage) {
      setState(prev => ({
        ...prev,
        isSending: false,
        messages: [...prev.messages, newMessage as MessageWithSender],
      }))
    } else {
      setState(prev => ({ ...prev, isSending: false }))
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return { error: null }
  }, [conversationId])

  // ── Enviar proposta ───────────────────────────────────────────────────────

  const sendOffer = useCallback(async (amount: number) => {
    const userId = await getCachedUserId()
    if (!userId) return { error: 'Não autenticado' }

    setState(prev => ({ ...prev, isSending: true }))

    const activeOfferId = (state.conversation as Conversation & { active_offer_id?: string | null })?.active_offer_id
    if (activeOfferId) {
      const prevOffer = state.messages.find(m => m.id === activeOfferId)
      if (prevOffer) {
        await supabase
          .from('messages')
          .update({ payload: { ...prevOffer.payload as object, status: 'superseded' } })
          .eq('id', prevOffer.id)
      }
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: `Proposta: ${amount} Kz`,
        type: 'offer',
        status: 'sent',
        payload: { amount, status: 'pending' },
      })
      .select(MESSAGE_WITH_SENDER)
      .single()

    if (error) {
      setState(prev => ({ ...prev, isSending: false }))
      return { error: error.message }
    }

    if (newMessage) {
      setState(prev => ({
        ...prev,
        isSending: false,
        messages: [...prev.messages, newMessage as MessageWithSender],
      }))
    } else {
      setState(prev => ({ ...prev, isSending: false }))
    }

    await supabase
      .from('conversations')
      .update({
        active_offer_id: newMessage.id,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return { error: null }
  }, [conversationId, state.conversation, state.messages])

  // ── Responder a proposta (só vendedor) ────────────────────────────────────

  const respondToOffer = useCallback(async (
    messageId: string,
    response: 'accepted' | 'rejected'
  ) => {
    const userId = await getCachedUserId()
    if (!userId) return { error: 'Não autenticado' }

    if (state.conversation?.seller_id !== userId) {
      return { error: 'Apenas o vendedor pode responder a propostas' }
    }

    const message = state.messages.find(m => m.id === messageId)
    if (!message) return { error: 'Mensagem não encontrada' }

    const { error } = await supabase
      .from('messages')
      .update({ payload: { ...message.payload as object, status: response } })
      .eq('id', messageId)

    if (error) return { error: error.message }

    const convActiveOfferId = (state.conversation as Conversation & { active_offer_id?: string | null })?.active_offer_id
    if (convActiveOfferId === messageId) {
      await supabase
        .from('conversations')
        .update({ active_offer_id: null })
        .eq('id', conversationId)
    }

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: response === 'accepted'
          ? '✅ Proposta aceite. Combinem os detalhes da entrega.'
          : '❌ Proposta recusada.',
        type: 'system',
        status: 'sent',
      })

    return { error: null }
  }, [conversationId, state.conversation, state.messages])

  // ── Marcar mensagens como lidas ───────────────────────────────────────────

  const markAsRead = useCallback(async () => {
    const userId = await getCachedUserId()
    if (!userId) return

    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('status', 'sent')
  }, [conversationId])

  // ── Fechar negócio ────────────────────────────────────────────────────────

  const closeDeal = useCallback(async () => {
    const userId = await getCachedUserId()
    if (!userId || !state.conversation) return { error: 'Não autenticado' }

    const isBuyer = state.conversation.buyer.id === userId
    const update = isBuyer
      ? { closed_by_buyer: true }
      : { closed_by_seller: true }

    const { error } = await supabase
      .from('conversations')
      .update(update)
      .eq('id', conversationId)

    if (error) return { error: error.message }

    const updatedConv = await supabase
      .from('conversations')
      .select('closed_by_buyer, closed_by_seller')
      .eq('id', conversationId)
      .single()

    if (
      updatedConv.data?.closed_by_buyer &&
      updatedConv.data?.closed_by_seller
    ) {
      await Promise.all([
        supabase
          .from('conversations')
          .update({ status: 'closed' })
          .eq('id', conversationId),
        supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: '🤝 Negócio confirmado por ambas as partes. Avalia a tua experiência. Se algo correu mal, podes abrir uma disputa nos próximos 7 dias.',
            type: 'system',
            status: 'sent',
          }),
      ])
    }

    return { error: null }
  }, [conversationId, state.conversation])

  // ── Apagar conversa (só para o utilizador atual) ─────────────────────────

 const deleteConversation = useCallback(async () => {
  const userId = await getCachedUserId()
  if (!userId || !state.conversation) return { error: 'Não autenticado' }

  const { error } = await supabase.rpc('delete_conversation_for_user', {
    p_conversation_id: conversationId,
  })

  if (error) return { error: error.message }
  return { error: null }
}, [conversationId, state.conversation])

  // ── Bloquear o outro utilizador desta conversa ───────────────────────────

  const blockUser = useCallback(async () => {
    const userId = await getCachedUserId()
    if (!userId || !state.conversation) return { error: 'Não autenticado' }

    const otherUserId = state.conversation.buyer_id === userId
      ? state.conversation.seller_id
      : state.conversation.buyer_id

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: userId,
        blocked_id: otherUserId,
      })

    if (error) return { error: error.message }

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: '🚫 Esta conversa foi bloqueada por um dos utilizadores.',
        type: 'system',
        status: 'sent',
      })

    const { error: statusError } = await supabase
      .from('conversations')
      .update({ status: 'blocked' })
      .eq('id', conversationId)

    // Optimistic update — não esperar pelo Realtime para refletir na UI
    if (!statusError) {
      setState(prev => ({
        ...prev,
        conversation: prev.conversation
          ? { ...prev.conversation, status: 'blocked' }
          : prev.conversation,
      }))
    }

    return { error: statusError?.message ?? null }
  }, [conversationId, state.conversation])

  // ── Desbloquear — só quem bloqueou pode fazer isto ───────────────────────

  const unblockUser = useCallback(async () => {
    const userId = await getCachedUserId()
    if (!userId || !state.conversation) return { error: 'Não autenticado' }

    const otherUserId = state.conversation.buyer_id === userId
      ? state.conversation.seller_id
      : state.conversation.buyer_id

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', otherUserId)

    if (error) return { error: error.message }

    const { error: statusError } = await supabase
      .from('conversations')
      .update({ status: 'active' })
      .eq('id', conversationId)

    if (!statusError) {
      setState(prev => ({
        ...prev,
        conversation: prev.conversation
          ? { ...prev.conversation, status: 'active' }
          : prev.conversation,
      }))
    }

    return { error: statusError?.message ?? null }
  }, [conversationId, state.conversation])

  // ── Verificar se EU sou a pessoa bloqueada nesta conversa ────────────────

  const checkIsBlockedByOther = useCallback(async (): Promise<boolean> => {
    const userId = await getCachedUserId()
    if (!userId || !state.conversation) return false

    const otherUserId = state.conversation.buyer_id === userId
      ? state.conversation.seller_id
      : state.conversation.buyer_id

    const { data } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', userId)
      .maybeSingle()

    return !!data
  }, [state.conversation])

  // ── Abrir disputa ──────────────────────────────────────────────────────

  const openDispute = useCallback(async (reason: string) => {
    const userId = await getCachedUserId()
    if (!userId) return { error: 'Não autenticado' }

    const { error } = await supabase
      .from('disputes')
      .insert({
        conversation_id: conversationId,
        opened_by: userId,
        reason,
      })

    if (error) {
      if (error.code === '23505') {
        return { error: 'Já existe uma disputa para esta conversa.' }
      }
      return { error: error.message }
    }

    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: '⚠️ Disputa aberta. Um admin vai rever esta conversa.',
        type: 'system',
        status: 'sent',
      })

    return { error: null }
  }, [conversationId])

  // ── Buscar disputa existente da conversa ──────────────────────────────

  const getDispute = useCallback(async () => {
    const { data, error } = await supabase
      .from('disputes')
      .select('id, status, reason, resolution, created_at')
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (error || !data) return null
    return data
  }, [conversationId])

  return {
    ...state,
    sendMessage,
    sendImage,
    sendOffer,
    respondToOffer,
    markAsRead,
    closeDeal,
    deleteConversation,
    blockUser,
    unblockUser,
    checkIsBlockedByOther,
    fetchSuggestions,
    openDispute,
    getDispute,
  }
}

// =============================================
// HOOK — iniciar ou reutilizar conversa
// =============================================

export function useStartConversation() {
  const [isLoading, setIsLoading] = useState(false)

  const startConversation = useCallback(async (
    productId: string,
    sellerId: string
  ): Promise<{ conversationId: string | null; error: string | null }> => {
    setIsLoading(true)

    const userId = await getCachedUserId()
    if (!userId) {
      setIsLoading(false)
      return { conversationId: null, error: 'Não autenticado' }
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', userId)
      .eq('seller_id', sellerId)
      .single()

    if (existing) {
      setIsLoading(false)
      return { conversationId: existing.id, error: null }
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: userId,
        seller_id: sellerId,
      })
      .select('id')
      .single()

    setIsLoading(false)

    if (error) {
      if (error.code === '42501' || error.message.includes('policy')) {
        return { conversationId: null, error: 'Não é possível iniciar esta conversa.' }
      }
      return { conversationId: null, error: error.message }
    }
    return { conversationId: data.id, error: null }
  }, [])

  return { startConversation, isLoading }
}