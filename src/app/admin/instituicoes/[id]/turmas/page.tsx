'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap, Plus, Users, X } from 'lucide-react'
import { getClassesByInstitution, createClass, updateClass, deleteClass, getCourses, getAcademicYears } from '../actions'
import type { ClassRow, CourseRow, AcademicYearRow } from '../actions'

const GRADE_OPTIONS = [10, 11, 12]

export default function TurmasPage() {
  const params = useParams()
  const institutionId = params.id as string

  const [turmas, setTurmas] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ClassRow | null>(null)
  const [courseId, setCourseId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearRow[]>([])
  const [saving, setSaving] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const [turmasRes] = await Promise.all([getClassesByInstitution(institutionId)])
    if (turmasRes.success) setTurmas(turmasRes.data)
    else showToast('error', turmasRes.error)
    setLoading(false)
  }, [institutionId, showToast])

  useEffect(() => { load() }, [load])

  const loadFormDeps = useCallback(async () => {
    const [coursesRes, ayRes] = await Promise.all([
      getCourses(institutionId),
      getAcademicYears(institutionId),
    ])
    if (coursesRes.success) setCourses(coursesRes.data.filter(c => c.is_active))
    if (ayRes.success) setAcademicYears(ayRes.data)
  }, [institutionId])

  const openCreate = async () => {
    setEditing(null)
    setCourseId('')
    setAcademicYearId('')
    setName('')
    setGrade('')
    await loadFormDeps()
    setShowModal(true)
  }

  const openEdit = async (t: ClassRow) => {
    setEditing(t)
    setCourseId(t.course_id || '')
    setAcademicYearId(t.academic_year_id)
    setName(t.name)
    setGrade(t.grade?.toString() || '')
    await loadFormDeps()
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !academicYearId || !grade) return
    setSaving(true)

    const payload = {
      institution_id: institutionId,
      academic_year_id: academicYearId,
      course_id: courseId || undefined,
      name: name.trim(),
      grade: Number(grade),
    }

    const res = editing
      ? await updateClass(editing.id, payload)
      : await createClass(payload)

    if (res.success) {
      showToast('success', editing ? 'Turma atualizada.' : 'Turma criada.')
      setShowModal(false)
      load()
    } else {
      showToast('error', res.error)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que pretende eliminar esta turma?')) return
    const res = await deleteClass(id, institutionId)
    if (res.success) {
      showToast('success', 'Turma eliminada.')
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
            <GraduationCap className="w-5 h-5 text-[#4B187C]" />
            Turmas
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">{turmas.length} turma{turmas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          <Plus className="w-4 h-4" />
          Nova Turma
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <GraduationCap className="w-10 h-10 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">Nenhuma turma</h3>
          <p className="text-xs text-gray-400 font-sans">Crie a primeira turma para esta instituição.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Nome</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Ano</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Curso</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Ano Lectivo</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Alunos</th>
                  <th className="w-24 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FF]">
                {turmas.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f8f7ff] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-800">{t.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-semibold text-gray-700">{t.grade}º</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{t.course?.name || '---'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{t.academic_year?.label || '---'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {t.student_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(t)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#4B187C] hover:bg-[#EDE7FF] transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
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
              <h3 className="text-sm font-black text-gray-800">{editing ? 'Editar Turma' : 'Nova Turma'}</h3>
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
                  placeholder="Ex: Turma A"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Ano *</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
                >
                  <option value="">Selecionar ano...</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}º</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Curso</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
                >
                  <option value="">Sem curso</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Ano Lectivo *</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
                >
                  <option value="">Selecionar ano lectivo...</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !name.trim() || !academicYearId || !grade} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
