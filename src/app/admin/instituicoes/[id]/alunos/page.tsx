'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Store, ArrowUpRight, Filter, X } from 'lucide-react'
import { getInstitutionUsers, getInstitutionClasses } from '../actions'
import type { InstitutionUserRow, ClassOption } from '../actions'
import { ExportCSVButton } from '@/components/admin/export-csv-button'

export default function AlunosPage() {
  const params = useParams()
  const institutionId = params.id as string

  const [users, setUsers] = useState<InstitutionUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [classList, setClassList] = useState<ClassOption[]>([])
  const [filterClassId, setFilterClassId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const [usersRes, classesRes] = await Promise.all([
      getInstitutionUsers(institutionId, {
        class_id: filterClassId || undefined,
        status: filterStatus || undefined,
      }),
      getInstitutionClasses(institutionId),
    ])
    if (usersRes.success) setUsers(usersRes.data)
    else showToast('error', usersRes.error)
    if (classesRes.success) setClassList(classesRes.data)
    setLoading(false)
  }, [institutionId, filterClassId, filterStatus, showToast])

  useEffect(() => { load() }, [load])

  const students = users.filter(u => u.role === 'student')

  const hasFilters = filterClassId || filterStatus

  const clearFilters = () => {
    setFilterClassId('')
    setFilterStatus('')
  }

  function formatDate(d: string | null) {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-6 font-mono">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4B187C]" />
              Alunos
            </h2>
            <p className="text-xs text-gray-400 font-sans mt-1">{students.length} aluno{students.length !== 1 ? 's' : ''}</p>
          </div>
          <ExportCSVButton filters={{ institutionId }} label="Exportar CSV" />
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-[#EDE7FF]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
          >
            <option value="">Todos os estados</option>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
            <option value="pending">Pendente</option>
          </select>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="px-3 py-2 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
          >
            <option value="">Todas as turmas</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.grade ? ` (${c.grade}º)` : ''}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-100 transition-colors">
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <Users className="w-10 h-10 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">Nenhum aluno</h3>
          <p className="text-xs text-gray-400 font-sans">Esta instituição ainda não tem alunos registados.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Aluno</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Matrícula</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Verificado</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Vendedor</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Registo</th>
                  <th className="w-10 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FF]">
                {students.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f8f7ff] transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold text-sm shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-800 block truncate">{u.full_name}</span>
                          {u.email && (
                            <span className="text-[11px] text-gray-400 font-sans block truncate">{u.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-gray-600">{u.enrollment_code}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        u.status === 'suspended' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {u.status === 'active' ? 'Ativo' : u.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        u.is_verified ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {u.is_verified ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {u.student?.is_seller ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.student.is_verified_seller ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Store className="w-3 h-3" />
                          {u.student.is_verified_seller ? 'Verificado' : 'Sim'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{formatDate(u.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/utilizadores/${u.id}`}
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
      )}
    </div>
  )
}
