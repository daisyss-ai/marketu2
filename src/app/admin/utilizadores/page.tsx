import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FiltersBar } from './utilizadores-filters'
import { ExportCSVButton } from '@/components/admin/export-csv-button'
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  Clock,
  Star,
  Package,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  Store,
} from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 15

type UserRow = Database['public']['Tables']['users']['Row'] & {
  institution: { name: string } | null
  students: { is_seller: boolean | null; rating: number | null } | null
}

type Institution = { id: string; name: string }

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: {
    label: 'Ativo',
    className: 'bg-emerald-50 text-emerald-600',
    icon: UserCheck,
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-600',
    icon: Clock,
  },
  suspended: {
    label: 'Suspenso',
    className: 'bg-red-50 text-red-600',
    icon: UserX,
  },
}

async function getUsers(params: {
  search: string
  role: string
  status: string
  institutionId: string
  page: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select(
      `
        id,
        full_name,
        username,
        enrollment_code,
        email,
        role,
        status,
        created_at,
        institution_id,
        institution:institution_id (name),
        students (
          is_seller,
          rating
        )
      `,
      { count: 'exact' },
    )

  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,username.ilike.%${params.search}%,enrollment_code.ilike.%${params.search}%`,
    )
  }
  if (params.role) query = query.eq('role', params.role)
  if (params.status) query = query.eq('status', params.status)
  if (params.institutionId) query = query.eq('institution_id', params.institutionId)

  const from = (params.page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: users, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`Failed to fetch users: ${error.message}`)

  return { users: (users || []) as unknown as UserRow[], count: count || 0 }
}

async function getProductCounts(supabase: SupabaseClient<Database>, userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {}

  const { data } = await supabase
    .from('products')
    .select('seller_id')
    .in('seller_id', userIds)

  if (!data) return {}

  const counts: Record<string, number> = {}
  for (const p of data) {
    counts[p.seller_id] = (counts[p.seller_id] || 0) + 1
  }
  return counts
}

async function getInstitutions(supabase: SupabaseClient<Database>): Promise<Institution[]> {
  const { data } = await supabase
    .from('institution')
    .select('id, name')
    .order('name')

  return data || []
}

function buildPageUrl(
  page: number,
  current: { search: string; role: string; status: string; institutionId: string },
): string {
  const params = new URLSearchParams()
  if (current.search) params.set('search', current.search)
  if (current.role) params.set('role', current.role)
  if (current.status) params.set('status', current.status)
  if (current.institutionId) params.set('institution_id', current.institutionId)
  params.set('page', String(page))
  return `/admin/utilizadores?${params.toString()}`
}

function EmptyState() {
  return (
    <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
        <Users className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-800">Nenhum utilizador encontrado</h3>
      <p className="text-xs text-gray-400 font-sans max-w-sm">
        Nenhum utilizador corresponde aos filtros aplicados. Tente ajustar os critérios de pesquisa.
      </p>
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  filters,
}: {
  currentPage: number
  totalPages: number
  filters: { search: string; role: string; status: string; institutionId: string }
}) {
  if (totalPages <= 1) return null

  const pages: (number | 'dots')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'dots') {
      pages.push('dots')
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1, filters)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#EDE7FF] text-gray-600 hover:bg-[#f8f7ff] hover:border-[#4B187C] text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-100 text-gray-300 text-xs font-bold cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === 'dots' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-xs">
              ...
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageUrl(p, filters)}
              className={`min-w-[36px] px-3 py-2 rounded-xl text-xs font-bold transition-colors text-center ${
                p === currentPage
                  ? 'bg-[#4B187C] text-white shadow-sm'
                  : 'border border-[#EDE7FF] text-gray-600 hover:bg-[#f8f7ff] hover:border-[#4B187C]'
              }`}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1, filters)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#EDE7FF] text-gray-600 hover:bg-[#f8f7ff] hover:border-[#4B187C] text-xs font-bold transition-colors"
        >
          Seguinte
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-100 text-gray-300 text-xs font-bold cursor-not-allowed">
          Seguinte
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
      <GraduationCap className="w-3 h-3" />
      Estudante
    </span>
  )
}

function SellerBadge({ isSeller, rating }: { isSeller: boolean | null; rating: number | null }) {
  if (!isSeller) return null

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
      <Store className="w-3 h-3" />
      Vendedor
      {rating != null && rating > 0 && (
        <>
          <Star className="w-3 h-3 ml-0.5" />
          {rating.toFixed(1)}
        </>
      )}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const config = statusConfig[status || ''] || {
    label: status || 'Desconhecido',
    className: 'bg-gray-50 text-gray-500',
    icon: Clock,
  }
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default async function UtilizadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const role = typeof params.role === 'string' ? params.role : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const institutionId = typeof params.institution_id === 'string' ? params.institution_id : ''
  const page = Math.max(1, Number(params.page) || 1)

  const supabase = await createClient()
  const [userResult, institutions] = await Promise.all([
    getUsers({ search, role, status, institutionId, page }),
    getInstitutions(supabase),
  ])

  const { users, count: totalCount } = userResult
  const userIds = users.map((u) => u.id)
  const productCounts = await getProductCounts(supabase, userIds)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const filters = { search, role, status, institutionId }

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#4B187C]" />
            Utilizadores
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">
            {totalCount} utilizador{totalCount !== 1 ? 'es' : ''} registado{totalCount !== 1 ? 's' : ''} na plataforma.
          </p>
        </div>
        <ExportCSVButton filters={{ search, role, status, institutionId }} />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="bg-white p-4 rounded-2xl border border-[#EDE7FF] shadow-sm animate-pulse h-[68px]" />}>
        <FiltersBar
          search={search}
          role={role}
          status={status}
          institutionId={institutionId}
          institutions={institutions}
        />
      </Suspense>

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Utilizador
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Instituição
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Registo
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="w-10 px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE7FF]">
                  {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[#f8f7ff] transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/utilizadores/${user.id}`}
                            className="flex items-center gap-3 hover:no-underline"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold text-sm shrink-0">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-gray-800 block truncate group-hover:text-[#4B187C] transition-colors">
                                {user.full_name}
                              </span>
                              <span className="text-[11px] text-gray-400 font-sans block truncate">
                                @{user.username || user.enrollment_code}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-600 truncate max-w-[180px]">
                              {user.institution?.name || '---'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-xs font-medium text-gray-500 font-sans">
                              {formatDate(user.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <RoleBadge role={user.role} />
                            <SellerBadge
                              isSeller={user.students?.is_seller ?? null}
                              rating={user.students?.rating ?? null}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            {productCounts[user.id] || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/utilizadores/${user.id}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[#4B187C] hover:bg-[#EDE7FF] transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} filters={filters} />
        </>
      )}
    </div>
  )
}
