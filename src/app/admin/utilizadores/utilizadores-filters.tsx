'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useRef } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

type Props = {
  search: string
  role: string
  status: string
  institutionId: string
  institutions: { id: string; name: string }[]
}

export function FiltersBar({ search, role, status, institutionId, institutions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    params.delete('page')
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const hasFilters = search || role || status || institutionId

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#EDE7FF] shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-gray-500 mb-1 block font-sans">
            Pesquisar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              defaultValue={search}
              placeholder="Nome, username ou matrícula..."
              onChange={(e) => {
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
                const value = e.target.value
                searchTimeoutRef.current = setTimeout(() => {
                  buildUrl({ search: value })
                }, 400)
              }}
              className="w-full text-xs bg-gray-50 border border-[#EDE7FF] rounded-xl pl-8 pr-3 py-2.5 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Role */}
        <div className="min-w-[140px]">
          <label className="text-xs font-bold text-gray-500 mb-1 block font-sans">
            Função
          </label>
          <select
            value={role}
            onChange={(e) => buildUrl({ role: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-[#EDE7FF] rounded-xl px-3 py-2.5 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer"
          >
            <option value="">Todas</option>
            <option value="student">Estudante</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Status */}
        <div className="min-w-[140px]">
          <label className="text-xs font-bold text-gray-500 mb-1 block font-sans">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => buildUrl({ status: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-[#EDE7FF] rounded-xl px-3 py-2.5 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="active">Ativo</option>
            <option value="pending">Pendente</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>

        {/* Institution */}
        <div className="min-w-[160px]">
          <label className="text-xs font-bold text-gray-500 mb-1 block font-sans">
            Instituição
          </label>
          <select
            value={institutionId}
            onChange={(e) => buildUrl({ institution_id: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-[#EDE7FF] rounded-xl px-3 py-2.5 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer"
          >
            <option value="">Todas</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {hasFilters && (
          <Link
            href="/admin/utilizadores"
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 text-xs font-bold transition-colors self-end"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </Link>
        )}
      </div>
    </div>
  )
}
