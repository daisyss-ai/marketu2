'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Package,
  Store,
  Users,
  XCircle,
} from 'lucide-react'
import { getInstitutionById } from '../actions'
import type { InstitutionRow } from '../actions'
import { getInstitutionStats } from './actions'
import type { InstitutionStats } from './actions'

export default function InstituicaoDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const institutionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [institution, setInstitution] = useState<InstitutionRow | null>(null)
  const [stats, setStats] = useState<InstitutionStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeTab = pathname === `/admin/instituicoes/${institutionId}`
    ? 'resumo'
    : pathname.replace(`/admin/instituicoes/${institutionId}/`, '')

  const tabs = [
    { key: 'resumo', label: 'Resumo', href: `/admin/instituicoes/${institutionId}`, icon: Building2 },
    { key: 'cursos', label: 'Cursos', href: `/admin/instituicoes/${institutionId}/cursos`, icon: BookOpen },
    { key: 'turmas', label: 'Turmas', href: `/admin/instituicoes/${institutionId}/turmas`, icon: GraduationCap },
    { key: 'anos-lectivos', label: 'Anos Lectivos', href: `/admin/instituicoes/${institutionId}/anos-lectivos`, icon: CalendarDays },
    { key: 'alunos', label: 'Alunos', href: `/admin/instituicoes/${institutionId}/alunos`, icon: Users },
  ]

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [instRes, statsRes] = await Promise.all([
      getInstitutionById(institutionId),
      getInstitutionStats(institutionId),
    ])

    if (instRes.success && instRes.data) {
      setInstitution(instRes.data)
    } else {
      setError(instRes.error || 'Instituição não encontrada.')
      setLoading(false)
      return
    }

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data)
    }

    setLoading(false)
  }, [institutionId])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !institution) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm text-gray-500">{error || 'Instituição não encontrada.'}</p>
        <Link href="/admin/instituicoes" className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
        <div className="flex items-start gap-4">
          <Link href="/admin/instituicoes" className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#EDE7FF] text-gray-400 hover:text-[#4B187C] hover:border-[#4B187C] transition-colors shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-black shrink-0">
                {institution.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800">{institution.name}</h2>
                {institution.address && (
                  <p className="text-xs text-gray-400 font-sans">{institution.address}</p>
                )}
              </div>
              <span className={`ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                institution.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {institution.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#EDE7FF]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alunos</p>
                <p className="text-lg font-black text-gray-800">{stats.studentCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos</p>
                <p className="text-lg font-black text-gray-800">{stats.productCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendedores Verificados</p>
                <p className="text-lg font-black text-gray-800">{stats.verifiedSellerCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EDE7FF] bg-white rounded-2xl border border-[#EDE7FF] shadow-sm overflow-hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-[#4B187C] text-[#4B187C] bg-[#f8f7ff]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Resumo content */}
      {activeTab === 'resumo' && (
        <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome</p>
              <p className="text-sm font-semibold text-gray-700">{institution.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Endereço</p>
              <p className="text-sm font-semibold text-gray-700">{institution.address || '---'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</p>
              <p className="text-sm font-semibold text-gray-700">{institution.is_active ? 'Ativa' : 'Inativa'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Criada em</p>
              <p className="text-sm font-semibold text-gray-700 font-sans">
                {institution.created_at
                  ? new Date(institution.created_at).toLocaleDateString('pt-PT', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '---'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
