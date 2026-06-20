import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ConversationList from "@/components/chat/ConversationList";
import ChatView from "@/components/chat/ChatView";
import type { Database } from "@/types/supabase";
import type { ConversationWithDetails, MessageWithSender } from "@/types/chat";

// =============================================
// FETCH — conversas
// =============================================

async function getConversations(
  userId: string,
  supabase: any
): Promise<ConversationWithDetails[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      product:product_id ( id, title, price, 
        product_media ( url, position, is_preview ) 
      ),
      buyer:conversations_buyer_id_fkey ( id, full_name, avatar_url ),
      seller:conversations_seller_id_fkey ( id, full_name, avatar_url ),
      messages!messages_conversation_id_fkey (
  id, content, type, payload, status, created_at,
  sender:sender_id ( id, full_name, avatar_url )
)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
      

  if (error || !data) return [];

  return data.map((conv: any) => {
    const msgs = (conv.messages ?? []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      ...conv,
      last_message: msgs[0] ?? null,
      unread_count: 0, // calculado em tempo real pelo useConversations no cliente
      active_dispute: null,
      active_offer: null,
    } as ConversationWithDetails;
  });
}

// =============================================
// FETCH — mensagens iniciais
// =============================================

async function getMessages(
  conversationId: string,
  supabase: any
): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id ( id, full_name, avatar_url )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as MessageWithSender[];
}

// =============================================
// PÁGINA
// =============================================

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [conversations, initialMessages] = await Promise.all([
    getConversations(user.id, supabase),
    getMessages(id, supabase),
  ]);

  const conversation = conversations.find((c) => c.id === id);
  if (!conversation) notFound();

  return (
    <>
      {/* Sidebar — lista (oculta em mobile quando conversa aberta) */}
      <aside className="hidden md:flex md:w-80 lg:w-96 border-r border-[#EDE7FF] flex-col shrink-0 h-full">
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
          activeId={id}
        />
      </aside>

      {/* Área reativa — tempo real */}
      <ChatView
        conversationId={id}
        currentUserId={user.id}
        initialConversation={conversation}
        initialMessages={initialMessages}
      />
    </>
  );
}