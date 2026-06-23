import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, Package, TrendingUp, Building2, Clock,
  AlertCircle, ArrowRight, UserCheck, UserX,
  CheckCircle2, XCircle, ArrowUp, Hourglass,
  ShoppingCart, Star, Store, Tag, BarChart3,
} from 'lucide-react'
import { IntervalSelector } from './interval-selector'
import {
  ActivityChart, ExportForm, TopProductsTabs, DataTable, OrderStatusChart,
} from './charts-client'
import {
  exportActivityCSV, exportTopProductsCSV, exportTopVendorsCSV,
  exportCategoriesCSV, exportOrderStatusCSV,
} from './actions'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type UsersStats = { pending: number; active: number; suspended: number; total: number; newInPeriod: number }
type ProductsStats = { active: number; pending: number; rejected: number; total: number; newInPeriod: number }
type TransactionStats = { total: number; periodTotal: number }
type InstitutionDist = { name: string; count: number }
type ActivityPoint = { date: string; users: number; products: number }
type TopProduct = { id: string; title: string; total_sales: number | null; total_reviews: number | null }
type TopVendor = { seller_id: string; full_name: string; product_count: number; total_sales: number }
type CategoryDist = { id: string; name: string; product_count: number }
type OrderStatusPoint = { status: string; count: number }

async function getUsersStats(sb: SupabaseClient<Database>, days: number): Promise<UsersStats> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const [p, a, s, n] = await Promise.all([
    sb.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('users').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    sb.from('users').select('*', { count: 'exact', head: true }).gte('created_at', since),
  ])
  return {
    pending: p.count ?? 0, active: a.count ?? 0, suspended: s.count ?? 0,
    total: (p.count ?? 0) + (a.count ?? 0) + (s.count ?? 0),
    newInPeriod: n.count ?? 0,
  }
}

async function getProductsStats(sb: SupabaseClient<Database>, days: number): Promise<ProductsStats> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const [ac, rc, tc, nc] = await Promise.all([
    sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_approved', true),
    sb.from('content_moderation').select('product_id', { count: 'exact', head: true }).eq('status', 'rejected'),
    sb.from('products').select('*', { count: 'exact', head: true }),
    sb.from('products').select('*', { count: 'exact', head: true }).gte('created_at', since),
  ])
  const total = tc.count ?? 0
  const active = ac.count ?? 0
  const rejected = rc.count ?? 0
  return { active, pending: Math.max(0, total - active - rejected), rejected, total, newInPeriod: nc.count ?? 0 }
}

async function getTransactionStats(sb: SupabaseClient<Database>, days: number): Promise<TransactionStats> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const statuses: Database['public']['Enums']['order_status'][] = ['delivered', 'confirmed']

  const [allOrders, recentOrders] = await Promise.all([
    sb.from('orders').select('id').in('status', statuses),
    sb.from('orders').select('id').in('status', statuses).gte('created_at', since),
  ])

  const allIds = allOrders.data?.map(o => o.id) ?? []
  const recentIds = recentOrders.data?.map(o => o.id) ?? []

  const sumItems = async (ids: string[]) => {
    if (ids.length === 0) return 0
    const { data } = await sb.from('order_items').select('total_price').in('order_id', ids)
    return data?.reduce((s, i) => s + (i.total_price ?? 0), 0) ?? 0
  }

  const [total, periodTotal] = await Promise.all([sumItems(allIds), sumItems(recentIds)])
  return { total, periodTotal }
}

async function getInstitutionDistribution(sb: SupabaseClient<Database>): Promise<InstitutionDist[]> {
  const { data } = await sb.from('users').select('institution_id, institution:institution_id(name)')
  if (!data) return []

  const map = new Map<string, number>()
  const names = new Map<string, string>()

  for (const row of data) {
    const id = row.institution_id
    const inst = row.institution as unknown as { name: string } | null
    names.set(id, inst?.name ?? 'Desconhecida')
    map.set(id, (map.get(id) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .map(([id, count]) => ({ name: names.get(id) ?? 'Desconhecida', count }))
    .sort((a, b) => b.count - a.count)
}

async function getPendingRegistrationsCount(sb: SupabaseClient<Database>): Promise<number> {
  const { count } = await sb
    .from('enrollment_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count ?? 0
}

async function getActivityData(sb: SupabaseClient<Database>, days: number): Promise<ActivityPoint[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [usersRes, productsRes] = await Promise.all([
    sb.from('users').select('created_at').gte('created_at', since).order('created_at', { ascending: true }),
    sb.from('products').select('created_at').gte('created_at', since).order('created_at', { ascending: true }),
  ])

  const userCounts = new Map<string, number>()
  const productCounts = new Map<string, number>()

  for (const row of usersRes.data ?? []) {
    const day = (row.created_at ?? '').slice(0, 10)
    userCounts.set(day, (userCounts.get(day) ?? 0) + 1)
  }
  for (const row of productsRes.data ?? []) {
    const day = (row.created_at ?? '').slice(0, 10)
    productCounts.set(day, (productCounts.get(day) ?? 0) + 1)
  }

  const allDays = [...new Set([...userCounts.keys(), ...productCounts.keys()])].sort()
  return allDays.map(date => ({
    date,
    users: userCounts.get(date) ?? 0,
    products: productCounts.get(date) ?? 0,
  }))
}

async function getTopProducts(sb: SupabaseClient<Database>): Promise<{ bySales: TopProduct[]; byReviews: TopProduct[] }> {
  const [salesRes, reviewsRes] = await Promise.all([
    sb.from('products').select('id, title, total_sales, total_reviews')
      .not('total_sales', 'is', null).order('total_sales', { ascending: false }).limit(10),
    sb.from('products').select('id, title, total_sales, total_reviews')
      .not('total_reviews', 'is', null).order('total_reviews', { ascending: false }).limit(10),
  ])
  return {
    bySales: (salesRes.data ?? []) as TopProduct[],
    byReviews: (reviewsRes.data ?? []) as TopProduct[],
  }
}

async function getTopVendors(sb: SupabaseClient<Database>): Promise<TopVendor[]> {
  const { data } = await sb
    .from('products')
    .select('seller_id, total_sales, seller:seller_id(full_name)')

  if (!data) return []

  const map = new Map<string, { full_name: string; product_count: number; total_sales: number }>()
  for (const row of data) {
    const seller = row.seller as unknown as { full_name: string } | null
    const id = row.seller_id
    const existing = map.get(id) ?? {
      full_name: seller?.full_name ?? 'Desconhecido', product_count: 0, total_sales: 0,
    }
    existing.product_count++
    existing.total_sales += (row.total_sales ?? 0)
    map.set(id, existing)
  }

  return Array.from(map.entries())
    .map(([seller_id, v]) => ({ seller_id, ...v }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 10)
}

async function getCategoryDistribution(sb: SupabaseClient<Database>): Promise<CategoryDist[]> {
  const { data } = await sb
    .from('products')
    .select('category_id, category:category_id(name)')

  if (!data) return []

  const map = new Map<string, { name: string; count: number }>()
  for (const row of data) {
    const cat = row.category as unknown as { name: string } | null
    const id = row.category_id ?? 'uncategorized'
    const existing = map.get(id) ?? { name: cat?.name ?? 'Sem categoria', count: 0 }
    existing.count++
    map.set(id, existing)
  }

  return Array.from(map.entries())
    .map(([id, v]) => ({ id, name: v.name, product_count: v.count }))
    .sort((a, b) => b.product_count - a.product_count)
}

async function getOrderStatusDistribution(sb: SupabaseClient<Database>): Promise<OrderStatusPoint[]> {
  const { data } = await sb.from('orders').select('status')
  if (!data) return []

  const map = new Map<string, number>()
  for (const row of data) {
    const status = row.status ?? 'unknown'
    map.set(status, (map.get(status) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-PT').format(n)
}

function fmtKz(n: number) {
  return `${new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(n)} Kz`
}

function MetricCard({ title, value, icon: Icon, children, href }: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
  href?: string
}) {
  const card = (
    <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm hover:shadow-md transition-all duration-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className="p-2.5 rounded-xl bg-[#f5f0ff] text-[#4B187C]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block hover:no-underline">{card}</Link>
  }
  return card
}

function Section({ title, icon: Icon, description, children, exportButton }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  children: React.ReactNode
  exportButton?: React.ReactNode
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Icon className="w-5 h-5 text-[#4B187C]" />
            {title}
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-1">{description}</p>
        </div>
        {exportButton && <div className="shrink-0">{exportButton}</div>}
      </div>
      {children}
    </div>
  )
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const interval = Math.min(90, Math.max(7, Number(params.interval) || 7))

  const supabase = await createClient()

  const [users, products, transactions, institutions, pendingRegs,
    activity, topProducts, vendors, categories, orderStatus] = await Promise.all([
    getUsersStats(supabase, interval),
    getProductsStats(supabase, interval),
    getTransactionStats(supabase, interval),
    getInstitutionDistribution(supabase),
    getPendingRegistrationsCount(supabase),
    getActivityData(supabase, interval),
    getTopProducts(supabase),
    getTopVendors(supabase),
    getCategoryDistribution(supabase),
    getOrderStatusDistribution(supabase),
  ])

  const maxInstCount = institutions.length > 0 ? institutions[0].count : 1
  const intervalLabel = `${interval} dias`

  return (
    <div className="flex flex-col gap-6 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#4B187C]" />
            Analytics
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">
            Métricas e estatísticas da plataforma.
          </p>
        </div>
        <IntervalSelector currentInterval={interval} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard title="Utilizadores" value={fmt(users.total)} icon={Users}>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <UserCheck className="w-3.5 h-3.5" />{fmt(users.active)}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-bold">
              <Hourglass className="w-3.5 h-3.5" />{fmt(users.pending)}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <UserX className="w-3.5 h-3.5" />{fmt(users.suspended)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />+{fmt(users.newInPeriod)}
            </span>
            <span className="text-gray-400 font-medium">novos ({intervalLabel})</span>
          </div>
        </MetricCard>

        <MetricCard title="Produtos" value={fmt(products.total)} icon={Package}>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />{fmt(products.active)}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-bold">
              <Clock className="w-3.5 h-3.5" />{fmt(products.pending)}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <XCircle className="w-3.5 h-3.5" />{fmt(products.rejected)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />+{fmt(products.newInPeriod)}
            </span>
            <span className="text-gray-400 font-medium">novos ({intervalLabel})</span>
          </div>
        </MetricCard>

        <MetricCard title="Volume de Vendas" value={fmtKz(transactions.total)} icon={TrendingUp}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="bg-[#EDE7FF] text-[#4B187C] font-bold px-2 py-0.5 rounded-lg">
              {fmtKz(transactions.periodTotal)}
            </span>
            <span className="text-gray-400 font-medium">({intervalLabel})</span>
          </div>
        </MetricCard>

        <MetricCard
          title="Registos Pendentes"
          value={fmt(pendingRegs)}
          icon={Clock}
          href={pendingRegs > 0 ? '/admin/registos' : undefined}
        >
          <div className="flex items-center gap-1.5 text-xs">
            {pendingRegs > 0 ? (
              <>
                <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />Ação requerida
                </span>
                <span className="text-gray-400 font-medium inline-flex items-center gap-0.5">
                  <ArrowRight className="w-3 h-3" />Ir para registos
                </span>
              </>
            ) : (
              <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-lg">
                Tudo limpo
              </span>
            )}
          </div>
        </MetricCard>
      </div>

      <Section
        title="Atividade ao Longo do Tempo"
        icon={BarChart3}
        description={`Novos utilizadores e novos produtos por dia (últimos ${intervalLabel}).`}
        exportButton={<ExportForm action={exportActivityCSV.bind(null, interval)} label="Exportar CSV" />}
      >
        <ActivityChart data={activity} />
      </Section>

      <Section
        title="Top Produtos"
        icon={ShoppingCart}
        description="Produtos com mais vendas e mais reviews."
        exportButton={
          <div className="flex gap-2">
            <ExportForm action={exportTopProductsCSV.bind(null, 'sales')} label="Exportar Vendas" />
            <ExportForm action={exportTopProductsCSV.bind(null, 'reviews')} label="Exportar Reviews" />
          </div>
        }
      >
        <TopProductsTabs bySales={topProducts.bySales} byReviews={topProducts.byReviews} />
      </Section>

      <Section
        title="Top Vendedores"
        icon={Store}
        description="Vendedores com mais produtos e maior volume de vendas."
        exportButton={<ExportForm action={exportTopVendorsCSV} label="Exportar CSV" />}
      >
        <DataTable
          columns={[
            { key: 'name', label: 'Vendedor' },
            { key: 'products', label: 'Produtos', align: 'right' },
            { key: 'sales', label: 'Total Vendas', align: 'right' },
          ]}
          data={vendors.map(v => ({
            name: v.full_name as React.ReactNode,
            products: fmt(v.product_count) as React.ReactNode,
            sales: fmt(v.total_sales) as React.ReactNode,
          }))}
        />
      </Section>

      <Section
        title="Categorias mais Ativas"
        icon={Tag}
        description="Número de produtos por categoria."
        exportButton={<ExportForm action={exportCategoriesCSV} label="Exportar CSV" />}
      >
        <DataTable
          columns={[
            { key: 'name', label: 'Categoria' },
            { key: 'count', label: 'Produtos', align: 'right' },
          ]}
          data={categories.map(c => ({
            name: c.name as React.ReactNode,
            count: fmt(c.product_count) as React.ReactNode,
          }))}
        />
      </Section>

      <Section
        title="Distribuição de Orders"
        icon={Star}
        description="Distribuição de orders por estado."
        exportButton={<ExportForm action={exportOrderStatusCSV} label="Exportar CSV" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderStatusChart data={orderStatus} />
          <div className="flex flex-col gap-2 justify-center">
            {orderStatus.map(s => (
              <div key={s.status} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: s.status === 'pending' ? '#f59e0b'
                      : s.status === 'confirmed' ? '#3b82f6'
                      : s.status === 'delivered' ? '#10b981'
                      : s.status === 'cancelled' ? '#ef4444' : '#9ca3af',
                  }}
                />
                <span className="text-xs font-medium text-gray-600 capitalize min-w-24">
                  {s.status === 'pending' ? 'Pendente'
                    : s.status === 'confirmed' ? 'Confirmado'
                    : s.status === 'delivered' ? 'Entregue'
                    : s.status === 'cancelled' ? 'Cancelado' : s.status}
                </span>
                <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, (s.count / Math.max(...orderStatus.map(x => x.count))) * 100)}%`,
                      backgroundColor: s.status === 'pending' ? '#f59e0b'
                        : s.status === 'confirmed' ? '#3b82f6'
                        : s.status === 'delivered' ? '#10b981'
                        : s.status === 'cancelled' ? '#ef4444' : '#9ca3af',
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-10 text-right">{fmt(s.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#4B187C]" />
          Utilizadores por Instituição
        </h3>
        <p className="text-xs text-gray-400 font-sans mb-6">
          Distribuição de utilizadores agrupados por instituição de ensino.
        </p>

        {institutions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            Nenhum utilizador registado.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {institutions.map((inst) => (
              <div key={inst.name} className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-700 w-48 truncate shrink-0">
                  {inst.name}
                </span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-7 bg-gray-50 rounded-xl overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#EDE7FF] to-[#4B187C] rounded-xl transition-all duration-500"
                      style={{ width: `${Math.max(2, (inst.count / maxInstCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-10 text-right shrink-0">
                    {fmt(inst.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
