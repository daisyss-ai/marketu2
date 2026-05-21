'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import { ChevronDown, ShoppingCart } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import ProductSearchBar from '../search/ProductSearchBar';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

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
  }, [currentSearch, debouncedSearch, pushSearchEffect]);

  return (
    <div>
      <div className="w-full h-1 bg-primary" />
      <header className="w-full bg-surface border-b border-muted/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-row items-center justify-between gap-4 text-foreground">
          <Link href="/home" className="flex items-center gap-2 min-w-fit group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1">
            <Image
              src="/assets/marketu-logo.png"
              alt="marketU"
              width={32}
              height={32}
              className="h-8 w-auto transition-transform group-hover:scale-105"
            />
            <span className="font-black text-2xl text-primary tracking-tight">marketU</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-semibold">
            <button className="flex items-center gap-1 text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1">
              Categorias <ChevronDown className="w-4 h-4" />
            </button>
          </nav>

          <div className="w-full max-w-xl">
            <ProductSearchBar
              value={searchValue}
              onChange={setSearchValue}
              enableAutocomplete
              onSubmit={() => navigateToSearch(searchValue)}
            />
          </div>

          <div className="flex items-center gap-6">
            <Link href="/profile" className="text-sm font-semibold text-muted hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1">
              Perfil
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-semibold text-muted hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1"
              >
                Sair
              </button>
            </form>
            {pathname !== '/profile' && (
              <Link
                href="/sell"
                className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] focus:ring-4 focus:ring-primary/30"
              >
                Vender
              </Link>
            )}
            <button className="relative group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full p-2" aria-label="Ver carrinho">
              <ShoppingCart className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">0</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
