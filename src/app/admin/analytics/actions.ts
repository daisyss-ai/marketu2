'use server'

import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/logAction'

export type ActionResult = { csv: string; count: number } | null

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Não autenticado.')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado.')
  return { adminId: user.id, supabase }
}

export async function exportActivityCSV(days: number, _prevState: ActionResult, _formData: FormData) {
  const { adminId, supabase } = await getAdminUser()

  const since = new Date(Date.now() - days * 86400000).toISOString()
  const [usersRes, productsRes] = await Promise.all([
    supabase.from('users').select('created_at').gte('created_at', since),
    supabase.from('products').select('created_at').gte('created_at', since),
  ])

  const userCounts = new Map<string, number>()
  const productCounts = new Map<string, number>()
  for (const r of usersRes.data ?? []) {
    const day = (r.created_at ?? '').slice(0, 10)
    userCounts.set(day, (userCounts.get(day) ?? 0) + 1)
  }
  for (const r of productsRes.data ?? []) {
    const day = (r.created_at ?? '').slice(0, 10)
    productCounts.set(day, (productCounts.get(day) ?? 0) + 1)
  }

  const allDays = [...new Set([...userCounts.keys(), ...productCounts.keys()])].sort()
  const header = 'date,new_users,new_products'
  const rows = allDays.map(d => `${escapeCSV(d)},${userCounts.get(d) ?? 0},${productCounts.get(d) ?? 0}`)
  const csv = [header, ...rows].join('\r\n')

  await logAdminAction({
    adminId, action: 'export_csv', targetType: 'export', targetId: 'analytics',
    metadata: { section: 'activity', days, recordCount: allDays.length },
  }).catch(console.error)

  return { csv, count: allDays.length }
}

export async function exportTopProductsCSV(type: 'sales' | 'reviews', _prevState: ActionResult, _formData: FormData) {
  const { adminId, supabase } = await getAdminUser()

  const { data } = await supabase
    .from('products')
    .select('id, title, total_sales, total_reviews')
    .not(`total_${type}`, 'is', null)
    .order(`total_${type}`, { ascending: false })
    .limit(100)

  const products = data ?? []
  const header = 'id,title,total_sales,total_reviews'
  const rows = products.map(p =>
    `${escapeCSV(p.id)},${escapeCSV(p.title)},${p.total_sales ?? 0},${p.total_reviews ?? 0}`
  )
  const csv = [header, ...rows].join('\r\n')

  await logAdminAction({
    adminId, action: 'export_csv', targetType: 'export', targetId: 'analytics',
    metadata: { section: `top_products_${type}`, recordCount: products.length },
  }).catch(console.error)

  return { csv, count: products.length }
}

export async function exportTopVendorsCSV(_prevState: ActionResult, _formData: FormData) {
  const { adminId, supabase } = await getAdminUser()

  const { data } = await supabase
    .from('products')
    .select('seller_id, total_sales, seller:seller_id(full_name)')

  const map = new Map<string, { full_name: string; product_count: number; total_sales: number }>()
  for (const row of data ?? []) {
    const seller = row.seller as unknown as { full_name: string } | null
    const id = row.seller_id
    const existing = map.get(id) ?? {
      full_name: seller?.full_name ?? 'Desconhecido', product_count: 0, total_sales: 0,
    }
    existing.product_count++
    existing.total_sales += (row.total_sales ?? 0)
    map.set(id, existing)
  }

  const vendors = Array.from(map.entries())
    .map(([seller_id, v]) => ({ seller_id, ...v }))
    .sort((a, b) => b.total_sales - a.total_sales)

  const header = 'seller_id,vendor_name,product_count,total_sales'
  const rows = vendors.map(v =>
    `${escapeCSV(v.seller_id)},${escapeCSV(v.full_name)},${v.product_count},${v.total_sales}`
  )
  const csv = [header, ...rows].join('\r\n')

  await logAdminAction({
    adminId, action: 'export_csv', targetType: 'export', targetId: 'analytics',
    metadata: { section: 'top_vendors', recordCount: vendors.length },
  }).catch(console.error)

  return { csv, count: vendors.length }
}

export async function exportCategoriesCSV(_prevState: ActionResult, _formData: FormData) {
  const { adminId, supabase } = await getAdminUser()

  const { data } = await supabase
    .from('products')
    .select('category_id, category:category_id(name)')

  const map = new Map<string, { name: string; count: number }>()
  for (const row of data ?? []) {
    const cat = row.category as unknown as { name: string } | null
    const id = row.category_id ?? 'uncategorized'
    const existing = map.get(id) ?? { name: cat?.name ?? 'Sem categoria', count: 0 }
    existing.count++
    map.set(id, existing)
  }

  const categories = Array.from(map.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)

  const header = 'category_id,category_name,product_count'
  const rows = categories.map(c => `${escapeCSV(c.id)},${escapeCSV(c.name)},${c.count}`)
  const csv = [header, ...rows].join('\r\n')

  await logAdminAction({
    adminId, action: 'export_csv', targetType: 'export', targetId: 'analytics',
    metadata: { section: 'categories', recordCount: categories.length },
  }).catch(console.error)

  return { csv, count: categories.length }
}

export async function exportOrderStatusCSV(_prevState: ActionResult, _formData: FormData) {
  const { adminId, supabase } = await getAdminUser()

  const { data } = await supabase.from('orders').select('status')
  const map = new Map<string, number>()
  for (const row of data ?? []) {
    const status = row.status ?? 'unknown'
    map.set(status, (map.get(status) ?? 0) + 1)
  }

  const statuses = Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const header = 'status,count'
  const rows = statuses.map(s => `${escapeCSV(s.status)},${s.count}`)
  const csv = [header, ...rows].join('\r\n')

  await logAdminAction({
    adminId, action: 'export_csv', targetType: 'export', targetId: 'analytics',
    metadata: { section: 'order_status_distribution', recordCount: statuses.length },
  }).catch(console.error)

  return { csv, count: statuses.length }
}
