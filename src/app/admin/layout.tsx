'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Package, 
  Tags, 
  Building2, 
  BarChart3, 
  Menu, 
  X, 
  LogOut,
  Shield
} from 'lucide-react';
import { logout } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';

type SidebarLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Utilizadores', href: '/admin/utilizadores', icon: Users },
  { label: 'Registos Pendentes', href: '/admin/registos', icon: Clock },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: Tags },
  { label: 'Instituições', href: '/admin/instituicoes', icon: Building2 },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>('Carregando...');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();
    
    const fetchAdminData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) {
            setAdminName(profile.full_name);
          } else {
            setAdminName('Administrador');
          }
        } else {
          setAdminName('Administrador');
        }
      } catch (err) {
        console.error('Erro ao buscar perfil do administrador:', err);
        setAdminName('Administrador');
      }
    };

    fetchAdminData();
  }, []);

  // Fechar sidebar mobile ao mudar de rota
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f7ff]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4B187C] border-t-transparent"></div>
          <span className="text-sm font-medium text-gray-500">A carregar painel...</span>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    const activeLink = sidebarLinks.find(link => link.href === pathname);
    return activeLink ? activeLink.label : 'Painel de Administração';
  };

  const renderNavLinks = () => {
    return sidebarLinks.map((link) => {
      const isActive = pathname === link.href;
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-[#EDE7FF] text-[#4B187C] shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'text-[#4B187C]' : 'text-gray-400'}`} />
          <span>{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <div className="flex h-screen bg-[#f8f7ff] text-foreground antialiased font-mono">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#EDE7FF] h-full shrink-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-[#EDE7FF]">
          <Shield className="w-6 h-6 text-[#4B187C]" />
          <span className="font-black text-lg tracking-tight text-primary">MARKETU ADMIN</span>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          {renderNavLinks()}
        </nav>
        <div className="p-4 border-t border-[#EDE7FF]">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{adminName}</p>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Admin</span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition-colors duration-200 text-sm font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Sidebar Mobile Overlay / Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Content */}
          <aside className="relative flex flex-col w-64 bg-white h-full shadow-2xl z-10 transition-transform duration-300 transform translate-x-0">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE7FF]">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#4B187C]" />
                <span className="font-black text-lg tracking-tight text-primary">MARKETU</span>
              </div>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
              {renderNavLinks()}
            </nav>
            <div className="p-4 border-t border-[#EDE7FF]">
              <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-gray-50 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{adminName}</p>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Admin</span>
                </div>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition-colors duration-200 text-sm font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#EDE7FF] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
              aria-label="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg text-gray-800">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-800 leading-none">{adminName}</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Administrador</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] border border-[#EDE7FF] flex items-center justify-center font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#f8f7ff] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
