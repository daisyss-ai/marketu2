'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarDays, CheckCircle, Plus, X } from 'lucide-react'
import { getAcademicYears, createAcademicYear, updateAcademicYear, setActiveAcademicYear, deleteAcademicYear } from '../actions'
import type { AcademicYearRow } from '../actions'

export default function AnosLectivosPage() {
  const params = useParams()
  const institutionId = params.id as string

  const [years, setYears] = useState<AcademicYearRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AcademicYearRow | null>(null)
  const [label, setLabel] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getAcademicYears(institutionId)
    if (res.success) setYears(res.data)
    else showToast('error', res.error)
    setLoading(false)
  }, [institutionId, showToast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setLabel('')
    setStartsAt('')
    setEndsAt('')
    setShowModal(true)
  }

  const openEdit = (y: AcademicYearRow) => {
    setEditing(y)
    setLabel(y.label)
    setStartsAt(y.starts_at?.split('T')[0] || '')
    setEndsAt(y.ends_at?.split('T')[0] || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!label.trim()) return
    setSaving(true)

    const payload = {
      label: label.trim(),
      starts_at: startsAt || undefined,
      ends_at: endsAt || undefined,
    }

    const res = editing
      ? await updateAcademicYear(editing.id, payload)
      : await createAcademicYear({ ...payload, institution_id: institutionId })

    if (res.success) {
      showToast('success', editing ? 'Ano lectivo atualizado.' : 'Ano lectivo criado.')
      setShowModal(false)
      load()
    } else {
      showToast('error', res.error)
    }
    setSaving(false)
  }

  const handleSetActive = async (id: string) => {
    const res = await setActiveAcademicYear(id, institutionId)
    if (res.success) {
      showToast('success', 'Ano lectivo definido como ativo.')
      load()
    } else {
      showToast('error', res.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que pretende eliminar este ano lectivo?')) return
    const res = await deleteAcademicYear(id, institutionId)
    if (res.success) {
      showToast('success', 'Ano lectivo eliminado.')
      load()
    } else {
      showToast('error', res.error)
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '---'
    return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#4B187C]" />
            Anos Lectivos
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">{years.length} ano{years.length !== 1 ? 's' : ''} lectivo{years.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          <Plus className="w-4 h-4" />
          Novo Ano Lectivo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
        </div>
      ) : years.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <CalendarDays className="w-10 h-10 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">Nenhum ano lectivo</h3>
          <p className="text-xs text-gray-400 font-sans">Crie o primeiro ano lectivo para esta instituição.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Label</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Início</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Fim</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                  <th className="w-36 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FF]">
                {years.map((y) => (
                  <tr key={y.id} className="hover:bg-[#f8f7ff] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-800">{y.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{formatDate(y.starts_at)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{formatDate(y.ends_at)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        y.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {y.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {!y.is_active && (
                          <button onClick={() => handleSetActive(y.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ativar
                          </button>
                        )}
                        <button onClick={() => openEdit(y)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#4B187C] hover:bg-[#EDE7FF] transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(y.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE7FF] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800">{editing ? 'Editar Ano Lectivo' : 'Novo Ano Lectivo'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Label *</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Ex: 2025/2026"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Início</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Fim</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !label.trim()} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
