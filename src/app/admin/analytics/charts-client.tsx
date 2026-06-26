'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import type { ActionResult } from './actions'

// --- Types shared with page ---

export type ActivityPoint = { date: string; users: number; products: number }

export type TopProduct = {
  id: string
  title: string
  total_sales: number | null
  total_reviews: number | null
}

export type TopVendor = {
  seller_id: string
  full_name: string
  product_count: number
  total_sales: number
}

export type CategoryDist = {
  id: string
  name: string
  product_count: number
}

export type OrderStatusPoint = { status: string; count: number }

// --- Export Form (form-based Server Action) ---

export function ExportForm({ action, label }: {
  action: (prevState: ActionResult, formData: FormData) => Promise<{ csv: string; count: number }>
  label: string
}) {
  const [state, formAction, pending] = useActionState(action, null as ActionResult)
  const prevStateRef = useRef(state)

  useEffect(() => {
    if (!state) return
    if (prevStateRef.current === state) return
    prevStateRef.current = state

    const blob = new Blob(['\uFEFF' + state.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label.toLowerCase().replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [state, label])

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-[#EDE7FF] rounded-xl hover:bg-[#f5f0ff] hover:text-[#4B187C] transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        {pending ? 'A exportar...' : label}
      </button>
    </form>
  )
}

// --- Activity Line Chart ---

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-xs text-gray-400">Sem dados neste período.</div>
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) => {
              const d = new Date(v + 'T00:00:00')
              return `${d.getDate()}/${d.getMonth() + 1}`
            }}
          />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EDE7FF' }}
            labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-PT')}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="users" stroke="#4B187C" strokeWidth={2} dot={false} name="Novos Utilizadores" />
          <Line type="monotone" dataKey="products" stroke="#7c3aed" strokeWidth={2} dot={false} name="Novos Produtos" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Order Status Bar Chart ---

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export function OrderStatusChart({ data }: { data: OrderStatusPoint[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-xs text-gray-400">Sem dados de orders.</div>
  }

  const labeled = data.map(d => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={labeled} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EDE7FF' }}
            formatter={(value) => [value ?? 0, 'Quantidade']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Quantidade">
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Top Products Tabs ---

export function TopProductsTabs({ bySales, byReviews }: {
  bySales: TopProduct[]
  byReviews: TopProduct[]
}) {
  const [tab, setTab] = useState<'sales' | 'reviews'>('sales')

  const items = tab === 'sales' ? bySales : byReviews
  const keyLabel = tab === 'sales' ? 'Vendas' : 'Reviews'

  return (
    <div>
      <div className="flex items-center gap-1 bg-white border border-[#EDE7FF] rounded-xl p-1 mb-4 w-fit shadow-sm">
        <button
          onClick={() => setTab('sales')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            tab === 'sales' ? 'bg-[#4B187C] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Por Vendas
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            tab === 'reviews' ? 'bg-[#4B187C] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Por Reviews
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400">Nenhum produto.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-semibold text-gray-500">#</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-500">Produto</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">{keyLabel}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 px-2 font-medium text-gray-700 truncate max-w-60">{p.title}</td>
                  <td className="py-2 px-2 text-right font-bold text-gray-800">
                    {tab === 'sales'
                      ? new Intl.NumberFormat('pt-PT').format(p.total_sales ?? 0)
                      : new Intl.NumberFormat('pt-PT').format(p.total_reviews ?? 0)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// --- Simple Data Table ---

export function DataTable<T extends Record<string, React.ReactNode>>({ columns, data }: {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  data: T[]
}) {
  if (data.length === 0) {
    return <div className="text-center py-6 text-xs text-gray-400">Sem dados.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-2 font-semibold text-gray-400 w-8">#</th>
            {columns.map(col => (
              <th
                key={col.key}
                className={`py-2 px-2 font-semibold text-gray-500 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-2 px-2 text-gray-400">{i + 1}</td>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`py-2 px-2 ${col.align === 'right' ? 'text-right font-bold text-gray-800' : 'font-medium text-gray-700'}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
