'use server'

import { createClient } from '@/lib/supabase/server'

type ChatSuggestionResult = {
  suggestions: string[]
  limitReached: boolean
}

type ConversationParticipantRow = {
  id: string
  buyer_id: string
  seller_id: string
  status: string
}

type SuggestionMessageRow = {
  sender_id: string
  content: string
  type: 'text' | 'offer'
  payload: unknown
}

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

function getLuandaDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
  }).format(new Date())
}

export async function getChatSuggestions(
  conversationId: string,
  userId: string
): Promise<ChatSuggestionResult> {
  try {
    const normalizedConversationId = conversationId.trim()
    const normalizedUserId = userId.trim()

    if (!normalizedConversationId || !normalizedUserId) {
      return { suggestions: [], limitReached: false }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== normalizedUserId) {
      return { suggestions: [], limitReached: false }
    }

    const today = getLuandaDateKey()

    const { data: usageRow, error: usageError } = await supabase
      .from('ai_suggestion_usage')
      .select('count')
      .eq('user_id', normalizedUserId)
      .eq('date', today)
      .maybeSingle()

    if (usageError) {
      return { suggestions: [], limitReached: false }
    }

    if ((usageRow?.count ?? 0) >= 10) {
      return { suggestions: [], limitReached: true }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, status')
      .eq('id', normalizedConversationId)
      .maybeSingle()

    const typedConversation = conversation as ConversationParticipantRow | null

    if (conversationError || !typedConversation) {
      return { suggestions: [], limitReached: false }
    }

    const isParticipant =
      typedConversation.buyer_id === normalizedUserId ||
      typedConversation.seller_id === normalizedUserId

    if (!isParticipant || typedConversation.status !== 'active') {
      return { suggestions: [], limitReached: false }
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id, content, type, payload')
      .eq('conversation_id', normalizedConversationId)
      .in('type', ['text', 'offer'])
      .order('created_at', { ascending: false })
      .limit(6)

    if (messagesError) {
      return { suggestions: [], limitReached: false }
    }

    const history = ((messages ?? []) as SuggestionMessageRow[])
      .reverse()
      .map((msg) => {
        const offerAmount = msg.type === 'offer'
          ? (msg.payload as { amount?: number } | null | undefined)?.amount
          : null

        return {
          role: msg.sender_id === normalizedUserId ? 'user' : 'assistant',
          content: msg.type === 'offer' && typeof offerAmount === 'number'
            ? `[Proposta de preço: ${offerAmount} Kz]`
            : msg.content,
        }
      })

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `És um assistente de comunicação para um marketplace estudantil angolano chamado MarketU.
A tua tarefa é sugerir 3 respostas curtas e naturais em Português para o utilizador enviar.

Regras:
- Cada sugestão deve ter no máximo 8 palavras
- Adapta o idioma ao tom da conversa (formal ou informal)
- Nunca sugiras partilha de contactos externos (WhatsApp, telefone, IBAN, etc.)
- Nunca sugiras valores monetários específicos — se o contexto for de preço, sugere frases neutras
- As sugestões devem ser accionáveis e relevantes para a última mensagem recebida
- Responde APENAS com JSON válido, sem markdown, sem explicações

Formato de resposta obrigatório:
{"suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"]}`,
          },
          ...history,
        ],
      }),
    })

    if (!response.ok) {
      return { suggestions: [], limitReached: false }
    }

    const data = (await response.json()) as GroqChatResponse
    const text = data.choices?.[0]?.message?.content ?? '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as { suggestions?: unknown }
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item): item is string => typeof item === 'string')
      : []

    const nextCount = (usageRow?.count ?? 0) + 1
    const { error: usageUpsertError } = await supabase
      .from('ai_suggestion_usage')
      .upsert(
        {
          user_id: normalizedUserId,
          date: today,
          count: nextCount,
        },
        {
          onConflict: 'user_id,date',
        }
      )

    if (usageUpsertError) {
      return { suggestions: [], limitReached: false }
    }

    return { suggestions, limitReached: false }
  } catch {
    return { suggestions: [], limitReached: false }
  }
}
