'use client'

import type { SellerStats } from '@/lib/profile/getPublicProfile'

interface Props {
  stats: SellerStats
}

function StatItem({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl bg-muted/40 border border-border/40">
      <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function SellerStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatItem label="Produtos activos" value={stats.active_products} />
      <StatItem label="Vendas concluídas" value={stats.completed_sales} />
      <StatItem label="Taxa positiva" value={`${stats.positive_rate}%`} sub="avaliações positivas" />
      <StatItem label="Negócios confirmados" value={`${stats.confirmation_rate}%`} sub="vs iniciados" />
      <StatItem
        label="Tempo médio de resposta"
        value={formatResponseTime(stats.avg_response_minutes)}
        sub={stats.avg_response_minutes ? 'pending → confirmado' : 'sem dados'}
      />
    </div>
  )
}