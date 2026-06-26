'use client'

import { useCallback, useState } from 'react'
import { Download } from 'lucide-react'
import { exportUsersCSV } from '@/app/admin/actions/export-csv'
import type { ExportFilters } from '@/app/admin/actions/export-csv'

type Props = {
  filters: ExportFilters
  label?: string
}

export function ExportCSVButton({ filters, label = 'Exportar CSV' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = useCallback(async () => {
    setLoading(true)
    try {
      const result = await exportUsersCSV(filters)
      const blob = new Blob(['\uFEFF' + result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = `utilizadores_${new Date().toISOString().split('T')[0]}.csv`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao exportar CSV.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#4B187C] text-[#4B187C] hover:bg-[#f8f7ff] text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" />
      {loading ? 'A exportar...' : label}
    </button>
  )
}
