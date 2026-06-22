'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  Package, 
  Tags, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
}

const MetricCard = ({ title, value, change, isPositive, icon: Icon, color, href }: MetricCardProps) => {
  const content = (
    <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm hover:shadow-md transition-all duration-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {change}
          </span>
          <span className="text-xs text-gray-400 font-medium">vs. mês passado</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState<number | string>('...');

  useEffect(() => {
    const supabase = createClient();
    async function fetchPendingCount() {
      try {
        const { count, error } = await supabase
          .from('enrollment_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (!error && count !== null) {
          setPendingCount(count);
        } else {
          setPendingCount(0);
        }
      } catch (err) {
        console.error('Erro ao buscar quantidade de registos pendentes:', err);
        setPendingCount(0);
      }
    }
    fetchPendingCount();
  }, []);

  const metrics: MetricCardProps[] = [
    {
      title: 'Utilizadores',
      value: '1,248',
      change: '+18.2%',
      isPositive: true,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Registos Pendentes',
      value: pendingCount,
      change: 'Ação requerida',
      isPositive: false,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      href: '/admin/registos',
    },
    {
      title: 'Produtos Anunciados',
      value: '3,842',
      change: '+12.4%',
      isPositive: true,
      icon: Package,
      color: 'bg-[#EDE7FF] text-[#4B187C]',
    },
    {
      title: 'Vendas (Simuladas)',
      value: '452,000 Kz',
      change: '+24.5%',
      isPositive: true,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];


  return (
    <div className="flex flex-col gap-8 font-mono">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4B187C] to-[#6d28b0] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-lg" />
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Painel Geral
          </span>
          <h2 className="text-2xl md:text-3xl font-black mt-3 tracking-tight">
            Bem-vindo ao Painel de Administração do marketU!
          </h2>
          <p className="text-white/80 text-sm mt-2 leading-relaxed font-sans">
            Aqui pode gerir utilizadores, analisar anúncios de produtos, aprovar novos registos de estudantes e monitorizar a atividade da plataforma.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Two Column Layout: Quick Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions (2 Cols on Large Screen) */}
        <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#4B187C]" />
              Ações Rápidas de Moderação
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-sans">
              Aceda rapidamente aos módulos de moderação e verificação do sistema.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href="/admin/registos"
                className="flex items-center justify-between p-4 rounded-xl border border-[#EDE7FF] hover:border-[#4B187C] hover:bg-[#f8f7ff] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-gray-800 block">Registos Pendentes</span>
                    <span className="text-[10px] text-gray-400 font-sans">Aprovar estudantes</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                href="/admin/utilizadores"
                className="flex items-center justify-between p-4 rounded-xl border border-[#EDE7FF] hover:border-[#4B187C] hover:bg-[#f8f7ff] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-gray-800 block">Gerir Utilizadores</span>
                    <span className="text-[10px] text-gray-400 font-sans">Listar e editar perfis</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                href="/admin/produtos"
                className="flex items-center justify-between p-4 rounded-xl border border-[#EDE7FF] hover:border-[#4B187C] hover:bg-[#f8f7ff] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-gray-800 block">Moderar Produtos</span>
                    <span className="text-[10px] text-gray-400 font-sans">Verificar listagens</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                href="/admin/categorias"
                className="flex items-center justify-between p-4 rounded-xl border border-[#EDE7FF] hover:border-[#4B187C] hover:bg-[#f8f7ff] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Tags className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-gray-800 block">Categorias</span>
                    <span className="text-[10px] text-gray-400 font-sans">Gerir árvore de tags</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EDE7FF] flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Pressione qualquer atalho para aceder</span>
            <span className="text-[10px] bg-[#EDE7FF] text-[#4B187C] px-2 py-0.5 rounded font-bold uppercase">Ações</span>
          </div>
        </div>

        {/* System Status (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#4B187C]" />
              Estado do Sistema
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-sans">
              Monitorização em tempo real das conexões com os serviços principais.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">Supabase API</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operacional
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">Base de Dados</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operacional
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#4B187C]" />
                  <span className="text-xs font-bold text-gray-700">Backup</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Há 4 horas
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDE7FF] flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Versão da Plataforma</span>
            <span className="text-[10px] font-bold text-gray-600">v0.1.0-alpha</span>
          </div>
        </div>
      </div>
    </div>
  );
}
