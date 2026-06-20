import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ConversationList from "@/components/chat/ConversationList";
import type { Database } from "@/types/supabase";
import type { ConversationWithDetails } from "@/types/chat";

async function getConversations(userId: string): Promise<ConversationWithDetails[]> {
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

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      product:product_id (
        id, title, price,
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
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      ...conv,
      last_message: msgs[0] ?? null,
      unread_count: 0,
      active_dispute: null,
      active_offer: null,
    } as ConversationWithDetails;
  });
}

export default async function ChatPage() {
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

  const conversations = await getConversations(user.id);

  return (
    <>
      {/* Sidebar — lista de conversas */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-[#EDE7FF] flex flex-col shrink-0 h-full">
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
        />
      </aside>

      {/* Painel direito — placeholder quando nenhuma conversa está selecionada */}
      <main className="hidden md:flex flex-1 items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#EDE7FF] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#4B187C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Seleciona uma conversa</p>
          <p className="text-xs text-gray-400">As tuas negociações aparecem aqui</p>
        </div>
      </main>
    </>
  );
}