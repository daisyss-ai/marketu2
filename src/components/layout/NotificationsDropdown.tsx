'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, MessageCircle, Tag, Heart, Star, ShieldCheck, Info, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { getCachedUserId } from '@/hooks/useCurrentUser';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<string, { icon: typeof Bell; bg: string; fg: string }> = {
  new_interest: { icon: Eye, bg: '#E5F0FA', fg: '#1D5A8C' },
  new_message: { icon: MessageCircle, bg: '#E1F5EE', fg: '#0F6E56' },
  new_offer: { icon: Tag, bg: '#EAF3DE', fg: '#3B6D11' },
  offer_accepted: { icon: CheckCircle2, bg: '#EAF3DE', fg: '#3B6D11' },
  offer_rejected: { icon: XCircle, bg: '#FCEBEB', fg: '#A32D2D' },
  system_update: { icon: Info, bg: '#F1EFE8', fg: '#5F5E5A' },
  price_drop: { icon: Heart, bg: '#FBEAF0', fg: '#993556' },
  new_review: { icon: Star, bg: '#FAEEDA', fg: '#854F0B' },
  account_verified: { icon: ShieldCheck, bg: '#EEEDFE', fg: '#4B187C' },
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return days === 1 ? 'ontem' : `há ${days} dias`;
  return new Date(dateStr).toLocaleDateString('pt-PT');
}

export default function NotificationsDropdown() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const userId = await getCachedUserId();
    if (!userId) { setItems([]); return; }
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, data, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) { setItems([]); return; }
    setItems((data ?? []) as NotificationRow[]);
  }, []);

  useEffect(() => {
  let isMounted = true;
  let channel: ReturnType<ReturnType<typeof createBrowserClient>['channel']> | null = null;
  const supabase = createBrowserClient();

  const setup = async () => {
    const userId = await getCachedUserId();
    if (!userId || !isMounted) return;
    void fetchNotifications();
    channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => void fetchNotifications())
      .subscribe();
  };
  void setup();

  return () => {
    isMounted = false;
    if (channel) supabase.removeChannel(channel);
  };
}, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = createBrowserClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = createBrowserClient();
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative group focus:outline-none rounded-full p-2 hover:bg-[#EDE7FF] transition-all duration-200"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#4B187C] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notificações</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-[#4B187C] hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Sem notificações por agora</p>
            )}
            {items.map((n) => {
              const cfg = ICONS[n.type] ?? { icon: Bell, bg: '#F1EFE8', fg: '#5F5E5A' };
              const Icon = cfg.icon;
              const href = (n.data?.href as string | undefined) ?? '/notifications';
              return (
                <Link
                  key={n.id}
                  href={href as any}
                  onClick={() => { if (!n.is_read) void markAsRead(n.id); setOpen(false); }}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-[#FAF9FF] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-[18px] h-[18px]" style={{ color: cfg.fg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-gray-400 truncate">{n.body}</p>
                    )}
                    <p className="text-[11px] text-gray-300 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#4B187C] mt-1.5 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="px-4 py-2.5 text-center border-t border-gray-100">
            <Link href={'/notifications' as any} onClick={() => setOpen(false)} className="text-xs font-semibold text-[#4B187C] hover:underline">
              Ver todas as notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}