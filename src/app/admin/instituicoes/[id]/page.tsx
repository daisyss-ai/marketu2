'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  ImageUp,
  Package,
  Pencil,
  Store,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { getInstitutionById, updateInstitution, uploadInstitutionLogo } from '../actions'
import type { InstitutionRow } from '../actions'
import { getInstitutionStats } from './actions'
import type { InstitutionStats } from './actions'

export default function InstituicaoDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const institutionId = params.id as string

  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [institution, setInstitution] = useState<InstitutionRow | null>(null)
  const [stats, setStats] = useState<InstitutionStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)
  const [editUploading, setEditUploading] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const activeTab = pathname === `/admin/instituicoes/${institutionId}`
    ? 'resumo'
    : pathname.replace(`/admin/instituicoes/${institutionId}/`, '')

  const tabs = [
    { key: 'resumo', label: 'Resumo', href: `/admin/instituicoes/${institutionId}`, icon: Building2 },
    { key: 'cursos', label: 'Cursos', href: `/admin/instituicoes/${institutionId}/cursos`, icon: BookOpen },
    { key: 'turmas', label: 'Turmas', href: `/admin/instituicoes/${institutionId}/turmas`, icon: GraduationCap },
    { key: 'anos-lectivos', label: 'Anos Lectivos', href: `/admin/instituicoes/${institutionId}/anos-lectivos`, icon: CalendarDays },
    { key: 'alunos', label: 'Alunos', href: `/admin/instituicoes/${institutionId}/alunos`, icon: Users },
  ]

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [instRes, statsRes] = await Promise.all([
      getInstitutionById(institutionId),
      getInstitutionStats(institutionId),
    ])

    if (instRes.success && instRes.data) {
      setInstitution(instRes.data)
    } else {
      setError(instRes.error || 'Instituição não encontrada.')
      setLoading(false)
      return
    }

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data)
    }

    setLoading(false)
  }, [institutionId])

  useEffect(() => { loadData() }, [loadData])

  function openEditModal() {
    setEditName(institution?.name || '')
    setEditAddress(institution?.address || '')
    setEditLogoUrl(institution?.logo_url || '')
    setEditLogoFile(null)
    setEditLogoPreview(null)
    setShowEditModal(true)
  }

  async function handleSaveEdit() {
    if (!editName.trim() || !institution) return
    setSaving(true)

    let finalLogoUrl = editLogoUrl || undefined

    if (editLogoFile) {
      setEditUploading(true)

      const base64 = await fileToBase64(editLogoFile)
      const uploadRes = await uploadInstitutionLogo(institution.id, base64, editLogoFile.name)

      if (!uploadRes.success) {
        setToast({ type: 'error', msg: 'Erro ao fazer upload do logótipo.' })
        setSaving(false)
        setEditUploading(false)
        return
      }

      finalLogoUrl = uploadRes.publicUrl
      setEditUploading(false)
    }

    const res = await updateInstitution(institution.id, {
      name: editName.trim(),
      address: editAddress.trim() || undefined,
      logo_url: finalLogoUrl,
    })

    setSaving(false)
    if (res.success) {
      setShowEditModal(false)
      setToast({ type: 'success', msg: 'Instituição actualizada com sucesso.' })
      router.refresh()
      loadData()
    } else {
      setToast({ type: 'error', msg: res.error || 'Erro ao actualizar instituição.' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !institution) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm text-gray-500">{error || 'Instituição não encontrada.'}</p>
        <Link href="/admin/instituicoes" className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold font-sans transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-3 text-current opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5 inline" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
        <div className="flex items-start gap-4">
          <Link href="/admin/instituicoes" className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#EDE7FF] text-gray-400 hover:text-[#4B187C] hover:border-[#4B187C] transition-colors shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-10 h-10 rounded-full object-cover shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-black shrink-0">
                  {institution.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-black text-gray-800">{institution.name}</h2>
                {institution.address && (
                  <p className="text-xs text-gray-400 font-sans">{institution.address}</p>
                )}
              </div>
              <span className={`ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                institution.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {institution.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <button
                onClick={openEditModal}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:text-[#4B187C] hover:border-[#4B187C] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#EDE7FF]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alunos</p>
                <p className="text-lg font-black text-gray-800">{stats.studentCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos</p>
                <p className="text-lg font-black text-gray-800">{stats.productCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f7ff]">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendedores Verificados</p>
                <p className="text-lg font-black text-gray-800">{stats.verifiedSellerCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EDE7FF] bg-white rounded-2xl border border-[#EDE7FF] shadow-sm overflow-hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-[#4B187C] text-[#4B187C] bg-[#f8f7ff]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Resumo content */}
      {activeTab === 'resumo' && (
        <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome</p>
              <p className="text-sm font-semibold text-gray-700">{institution.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Endereço</p>
              <p className="text-sm font-semibold text-gray-700">{institution.address || '---'}</p>
            </div>
            {institution.logo_url && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logo</p>
                <img src={institution.logo_url} alt="Logo" className="mt-1 rounded-lg object-contain border border-[#EDE7FF]" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</p>
              <p className="text-sm font-semibold text-gray-700">{institution.is_active ? 'Ativo' : 'Inativo'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Criada em</p>
              <p className="text-sm font-semibold text-gray-700 font-sans">
                {institution.created_at
                  ? new Date(institution.created_at).toLocaleDateString('pt-PT', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '---'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE7FF] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800">Editar Instituição</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Nome *</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Nome da instituição"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Endereço</label>
                <input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Endereço da instituição"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Logótipo</label>
                <div className="flex items-center gap-3">
                  {(editLogoPreview || editLogoUrl) && (
                    <div className="w-14 h-14 rounded-xl border border-[#EDE7FF] overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                      <img
                        src={editLogoPreview || editLogoUrl}
                        alt="Logo preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-bold text-gray-500 hover:bg-[#f8f7ff] hover:border-[#4B187C] hover:text-[#4B187C] transition-colors"
                  >
                    <ImageUp className="w-4 h-4" />
                    {editLogoFile ? 'Alterar imagem' : 'Selecionar imagem'}
                  </button>
                  {(editLogoPreview || editLogoUrl) && (
                    <button
                      type="button"
                      onClick={() => { setEditLogoFile(null); setEditLogoPreview(null); setEditLogoUrl('') }}
                      className="px-3 py-2.5 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setEditLogoFile(file)
                    setEditLogoPreview(URL.createObjectURL(file))
                    setEditLogoUrl('')
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-1.5">Formatos aceites: JPG, PNG, WebP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={saving || editUploading || !editName.trim()} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {editUploading ? 'A enviar...' : saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
