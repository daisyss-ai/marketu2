'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, MessageCircle, Bell, X, Search, Menu } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import ProductSearchBar from '../search/ProductSearchBar';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

type HeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
};

function SavedProductsLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (isMounted) setCount(0); return; }
        const { count: savedCount, error } = await supabase
          .from('saved_products').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        if (!isMounted) return;
        if (error) { setCount(0); return; }
        setCount(savedCount ?? 0);
      } catch { if (isMounted) setCount(0); }
    };
    const handle = () => void fetchCount();
    void fetchCount();
    window.addEventListener('saved-products-changed', handle);
    return () => { isMounted = false; window.removeEventListener('saved-products-changed', handle); };
  }, []);
  return (
    <Link href="/orders" className="relative group focus:outline-none rounded-full p-2 hover:bg-[#EDE7FF] transition-all duration-200" aria-label="Ver carrinho">
      <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-error text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">{count}</span>
    </Link>
  );
}

function MessagesLink() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let isMounted = true;
    const supabase = createBrowserClient();
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      const { data: convs } = await supabase.from('conversations').select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).eq('status', 'active');
      if (!convs || convs.length === 0 || !isMounted) return;
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .in('conversation_id', convs.map((c: any) => c.id))
        .neq('sender_id', user.id).eq('status', 'sent');
      if (isMounted) setUnread(count ?? 0);
    };
    const channel = supabase.channel('header-messages-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => void fetchUnread())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => void fetchUnread())
      .subscribe();
    void fetchUnread();
    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, []);
  return (
    <Link href="/chat" className="relative group focus:outline-none rounded-full p-2 hover:bg-[#EDE7FF] transition-all duration-200" aria-label="Mensagens">
      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#4B187C] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

function NotificationsLink() {
  const [count] = useState(0);
  return (
    <Link href="/notifications" className="relative group focus:outline-none rounded-full p-2 hover:bg-[#EDE7FF] transition-all duration-200" aria-label="Notificações">
      <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

const Header = ({ searchValue: controlledSearchValue, onSearchChange, onSearchSubmit }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const currentSearch = searchParams.get('search') || '';
  const isSearchControlled = controlledSearchValue !== undefined;
  const [internalSearchValue, setInternalSearchValue] = useState(currentSearch);
  const searchValue = controlledSearchValue ?? internalSearchValue;
  const debouncedSearch = useDebouncedValue(searchValue, 320);

  const navigateToSearch = useCallback((nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue.trim()) params.set('search', nextValue.trim());
    else params.delete('search');
    params.delete('page');
    const targetPath = ((pathname || '/') === '/' ? '/home' : pathname) as Route;
    const qs = params.toString();
    router.push((qs ? `${targetPath}?${qs}` : targetPath) as Route, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushSearchEffect = useCallback((nextValue: string) => {
    navigateToSearch(nextValue);
  }, [navigateToSearch]);

  useEffect(() => {
    if (isSearchControlled) return;
    if (debouncedSearch.trim() === currentSearch.trim()) return;
    pushSearchEffect(debouncedSearch);
  }, [currentSearch, debouncedSearch, isSearchControlled, pushSearchEffect]);

  const handleSearchChange = useCallback((nextValue: string) => {
    if (isSearchControlled) {
      onSearchChange?.(nextValue);
      return;
    }

    setInternalSearchValue(nextValue);
  }, [isSearchControlled, onSearchChange]);

  const handleSearchSubmit = useCallback(() => {
    if (isSearchControlled) {
      onSearchSubmit?.();
      return;
    }

    navigateToSearch(searchValue);
  }, [isSearchControlled, navigateToSearch, onSearchSubmit, searchValue]);

  return (
    <div className="sticky top-0 z-50">
      <div className="w-full h-1 bg-primary" />
      <header className="w-full bg-surface border-b border-muted/10 shadow-sm">

        {/* Linha principal */}
        <div className="w-full px-4 md:px-20 py-3 flex items-center justify-between gap-3 text-foreground">

          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 min-w-fit group focus:outline-none rounded-lg p-1">
            <Image src="/assets/marketu-logo.png" alt="marketU" width={28} height={28} className="h-7 w-auto" />
            <span className="font-black text-xl md:text-2xl text-primary tracking-tight">MARKETU</span>
          </Link>

          {/* Pesquisa desktop */}
          <div className="hidden md:flex flex-1 max-w-4xl">
            <ProductSearchBar
              value={searchValue}
              onChange={handleSearchChange}
              enableAutocomplete
              onSubmit={handleSearchSubmit}
            />
          </div>

          {/* Acções direita */}
          <div className="flex items-center gap-1">

            {/* Pesquisa mobile */}
            <button
              onClick={() => { setMobileSearchOpen(prev => !prev); setMobileMenuOpen(false); }}
              className="md:hidden p-2 rounded-full hover:bg-[#EDE7FF] transition-colors"
              aria-label="Pesquisar"
            >
              {mobileSearchOpen ? <X className="w-5 h-5 text-gray-900" /> : <Search className="w-5 h-5 text-gray-900" />}
            </button>

            {/* Ícones sempre visíveis */}
            <MessagesLink />
            <NotificationsLink />
            <SavedProductsLink />

            {/* Divisor desktop */}
            <div className="hidden md:block w-px h-6 bg-gray-200 mx-1" />

            {/* Links desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/profile" className="text-sm font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all rounded-full px-3 py-1.5">Perfil</Link>
              <form action={logout}>
                <button type="submit" className="text-sm font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all rounded-full px-3 py-1.5">Sair</button>
              </form>
              {pathname !== '/profile' && (
                <Link href="/sell" className="text-sm font-semibold text-white bg-[#4B187C] hover:bg-[#3a1260] transition-all rounded-full px-4 py-1.5">Vender</Link>
              )}
            </div>

            {/* Hambúrguer mobile */}
            <button
              onClick={() => { setMobileMenuOpen(prev => !prev); setMobileSearchOpen(false); }}
              className="md:hidden p-2 rounded-full hover:bg-[#EDE7FF] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-900" /> : <Menu className="w-5 h-5 text-gray-900" />}
            </button>
          </div>
        </div>

        {/* Pesquisa mobile expandida */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3">
            <ProductSearchBar
              value={searchValue}
              onChange={handleSearchChange}
              enableAutocomplete
              onSubmit={handleSearchSubmit}
            />
          </div>
        )}

        {/* Menu mobile expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all rounded-xl px-3 py-2.5">
              Perfil
            </Link>
            {pathname !== '/profile' && (
              <Link href="/sell" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#4B187C] hover:bg-[#EDE7FF] transition-all rounded-xl px-3 py-2.5">
                Vender
              </Link>
            )}
            <form action={logout}>
              <button type="submit" className="w-full text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all rounded-xl px-3 py-2.5">
                Sair
              </button>
            </form>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;