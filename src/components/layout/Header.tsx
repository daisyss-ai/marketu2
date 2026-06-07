'use client';

import { logout } from '@/app/auth/actions';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { ShoppingCart } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import ProductSearchBar from '../search/ProductSearchBar';

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

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debouncedSearch = useDebouncedValue(searchValue, 320);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const navigateToSearch = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue.trim()) params.set('search', nextValue.trim());
    else params.delete('search');
    params.delete('page');

    const targetPath = ((pathname || '/') === '/' ? '/home' : pathname) as Route;
    const qs = params.toString();
    router.push((qs ? `${targetPath}?${qs}` : targetPath) as Route, { scroll: false });
  };

  const pushSearchEffect = useEffectEvent((nextValue: string) => {
    navigateToSearch(nextValue);
  });

  useEffect(() => {
    if (debouncedSearch.trim() === currentSearch.trim()) return;
    pushSearchEffect(debouncedSearch);
  }, [currentSearch, debouncedSearch]);

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
              onChange={setSearchValue}
              enableAutocomplete
              onSubmit={() => navigateToSearch(searchValue)}
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
