'use client';
import Link from 'next/link';
import React from 'react'
import { Search, ShoppingCart, ChevronDown } from 'lucide-react'


const Header = () => {
  return (
    <div>
      <div className="w-full h-1 bg-primary" />
      <header className="w-full bg-surface border-b border-muted/10 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-row items-center justify-between gap-4 text-foreground">
          {/* logo + text */}
          <Link href="/home" className="flex items-center gap-2 min-w-fit group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1">
            <img src="/assets/marketu-logo.png" alt="marketU" className="h-8 transition-transform group-hover:scale-105" />
            <span className="font-black text-2xl text-primary tracking-tight">marketU</span>
          </Link>

          {/* primary links (desktop only) */}
          <nav className="hidden md:flex items-center gap-6 font-semibold">
            <button className="flex items-center gap-1 text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1">
              Categorias <ChevronDown className="w-4 h-4" />
            </button>
          </nav>

          {/* search input */}
          <div className="w-full max-w-xl focus-within:max-w-3xl mx-auto bg-muted/5 rounded-full py-2.5 px-6 border border-muted/10 transition-all duration-300 flex items-center gap-3 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 group">
            <Search className="text-muted group-focus-within:text-primary transition-colors w-5 h-5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted/60"
              aria-label="Buscar produtos no marketplace"
            />
          </div>

          {/* user actions */}
          <div className="flex items-center gap-6">
            <Link href="/profile" className="text-sm font-semibold text-muted hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1">
              Perfil
            </Link>
            <Link
              href="/sell"
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] focus:ring-4 focus:ring-primary/30"
            >
              Vender
            </Link>
            <button className="relative group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full p-2" aria-label="Ver carrinho">
              <ShoppingCart className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">0</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}

export default Header
