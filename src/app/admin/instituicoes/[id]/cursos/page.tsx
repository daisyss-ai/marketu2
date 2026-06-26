'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Plus, X } from 'lucide-react'
import { getCourses, createCourse, updateCourse, archiveCourse } from '../actions'
import type { CourseRow } from '../actions'

export default function CursosPage() {
  const params = useParams()
  const institutionId = params.id as string

  const [cursos, setCursos] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CourseRow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationYears, setDurationYears] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getCourses(institutionId)
    if (res.success) setCursos(res.data)
    else showToast('error', res.error)
    setLoading(false)
  }, [institutionId, showToast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setDurationYears('')
    setShowModal(true)
  }

  const openEdit = (c: CourseRow) => {
    setEditing(c)
    setName(c.name)
    setDescription(c.description || '')
    setDurationYears(c.duration_years?.toString() || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      duration_years: durationYears ? Number(durationYears) : undefined,
    }

    const res = editing
      ? await updateCourse(editing.id, payload)
      : await createCourse({ ...payload, institution_id: institutionId })

    if (res.success) {
      showToast('success', editing ? 'Curso atualizado.' : 'Curso criado.')
      setShowModal(false)
      load()
    } else {
      showToast('error', res.error)
    }
    setSaving(false)
  }

  const handleArchive = async (id: string) => {
    const res = await archiveCourse(id, institutionId)
    if (res.success) {
      showToast('success', 'Curso arquivado.')
      load()
    } else {
      showToast('error', res.error)
    }
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
            <BookOpen className="w-5 h-5 text-[#4B187C]" />
            Cursos
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">{cursos.length} curso{cursos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          <Plus className="w-4 h-4" />
          Novo Curso
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
        </div>
      ) : cursos.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <BookOpen className="w-10 h-10 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">Nenhum curso</h3>
          <p className="text-xs text-gray-400 font-sans">Crie o primeiro curso para esta instituição.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Descrição</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Duração (anos)</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                  <th className="w-24 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FF]">
                {cursos.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f8f7ff] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-800">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{c.description || '---'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-semibold text-gray-700">{c.duration_years ?? '---'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {c.is_active ? 'Ativo' : 'Arquivado'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#4B187C] hover:bg-[#EDE7FF] transition-colors">
                          Editar
                        </button>
                        {c.is_active && (
                          <button onClick={() => handleArchive(c.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                            Arquivar
                          </button>
                        )}
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
              <h3 className="text-sm font-black text-gray-800">{editing ? 'Editar Curso' : 'Novo Curso'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Nome *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Nome do curso"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] resize-none"
                  placeholder="Descrição do curso"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Duração (anos)</label>
                <input
                  type="number"
                  min="1"
                  value={durationYears}
                  onChange={(e) => setDurationYears(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Ex: 3"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !name.trim()} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
