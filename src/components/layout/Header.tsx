'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setCount(0);
          }
          return;
        }

        const { count: savedCount, error } = await supabase
          .from('saved_products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!isMounted) {
          return;
        }

        if (error) {
          setCount(0);
          return;
        }

        setCount(savedCount ?? 0);
      } catch {
        if (isMounted) {
          setCount(0);
        }
      }
    };

    const handleSavedProductsChanged = () => {
      void fetchCount();
    };

    void fetchCount();
    window.addEventListener('saved-products-changed', handleSavedProductsChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('saved-products-changed', handleSavedProductsChanged);
    };
  }, []);

  return (
    <Link
      href="/orders"
      className="relative group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full p-2 hover:bg-[#EDE7FF] transition-all duration-200"
      aria-label="Ver carrinho"
    >
      <ShoppingCart className="w-6 h-6 text-gray-900 transition-colors" />
      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-error text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
        {count}
      </span>
    </Link>
  );
}

const Header = ({ searchValue: controlledSearchValue, onSearchChange, onSearchSubmit }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        <div className="w-full px-20 py-4 flex flex-row items-center justify-between gap-4 text-foreground">
          <Link href="/home" className="flex items-center gap-2 min-w-fit group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1">
            <Image
              src="/assets/marketu-logo.png"
              alt="marketU"
              width={32}
              height={32}
              className="h-8 w-auto transition-transform group-hover:scale-105"
            />
            <span className="font-black text-2xl text-primary tracking-tight">MARKETU</span>
          </Link>

          <div className="flex-1 max-w-4xl">
            <ProductSearchBar
              value={searchValue}
              onChange={handleSearchChange}
              enableAutocomplete
              onSubmit={handleSearchSubmit}
            />
          </div>

          <div className="flex items-center gap-6">
            <Link href="/profile" className="text-base font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all duration-200 focus:ring-2 focus:ring-primary/20 rounded-full px-3 py-1.5">
              Perfil
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-base font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all duration-200 focus:ring-2 focus:ring-primary/20 rounded-full px-3 py-1.5"
              >
                Sair
              </button>
            </form>
            {pathname !== '/profile' && (
              <Link
                href="/sell"
                className="text-base font-semibold text-gray-900 hover:bg-[#EDE7FF] transition-all duration-200 focus:ring-2 focus:ring-primary/20 rounded-full px-3 py-1.5"
              >
                Vender
              </Link>
            )}
            <SavedProductsLink />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
