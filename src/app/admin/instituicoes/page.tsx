'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  ExternalLink,
  ImageUp,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { getInstitutionsWithCount, createInstitution, updateInstitution, uploadInstitutionLogo, deactivateInstitution, activateInstitution } from './actions'
import type { InstitutionWithCount } from './actions'

export default function InstituicoesPage() {
  const [institutions, setInstitutions] = useState<InstitutionWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const [showInactive, setShowInactive] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getInstitutionsWithCount(showInactive)
    if (res.success) setInstitutions(res.data)
    else showToast('error', res.error || 'Erro ao carregar instituições.')
    setLoading(false)
  }, [showInactive, showToast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setName('')
    setAddress('')
    setLogoUrl('')
    setLogoFile(null)
    setLogoPreview(null)
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)

    const res = await createInstitution({
      name: name.trim(),
      address: address.trim() || undefined,
    })

    if (!res.success) {
      showToast('error', res.error || 'Erro ao criar instituição.')
      setSaving(false)
      return
    }

    if (logoFile && res.data?.id) {
      setUploading(true)

      const base64 = await fileToBase64(logoFile)
      const uploadRes = await uploadInstitutionLogo(res.data.id, base64, logoFile.name)

      if (!uploadRes.success) {
        showToast('error', 'Instituição criada, mas erro ao fazer upload do logótipo.')
        setUploading(false)
        setSaving(false)
        return
      }

      await updateInstitution(res.data.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        logo_url: uploadRes.publicUrl,
      })
      setUploading(false)
    }

    showToast('success', 'Instituição criada.')
    setShowModal(false)
    load()
    setSaving(false)
  }

  const handleToggleActive = async (inst: InstitutionWithCount) => {
    const res = inst.is_active
      ? await deactivateInstitution(inst.id)
      : await activateInstitution(inst.id)

    if (res.success) {
      showToast('success', inst.is_active ? 'Instituição desativada.' : 'Instituição ativada.')
      load()
    } else {
      showToast('error', res.error || 'Erro ao alterar estado da instituição.')
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

      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#4B187C]" />
            Instituições
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-1">{institutions.length} instituição{institutions.length !== 1 ? 'ões' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 accent-[#4B187C]"
            />
            <span className="text-xs font-bold text-gray-500">Inativas</span>
          </label>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
            <Plus className="w-4 h-4" />
            Nova Instituição
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <Building2 className="w-12 h-12 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">Nenhuma instituição</h3>
          <p className="text-xs text-gray-400 font-sans">Crie a primeira instituição para começar.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE7FF] bg-gray-50/50">
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Endereço</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase">Alunos</th>
                  <th className="w-44 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7FF]">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#f8f7ff] transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/instituicoes/${inst.id}`}
                        className="flex items-center gap-3 hover:text-[#4B187C] transition-colors"
                      >
                        {inst.logo_url ? (
                          <img src={inst.logo_url} alt={inst.name} className="w-9 h-9 rounded-full object-cover shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-bold text-sm shrink-0">
                            {inst.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-bold text-gray-800 group-hover:text-[#4B187C] transition-colors">
                          {inst.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-sans">{inst.address || '---'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inst.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {inst.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {inst.student_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/instituicoes/${inst.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#4B187C] hover:bg-[#EDE7FF] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Detalhes
                        </Link>
                        <button
                          onClick={() => handleToggleActive(inst)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                            inst.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {inst.is_active ? 'Desativar' : 'Ativar'}
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
              <h3 className="text-sm font-black text-gray-800">Nova Instituição</h3>
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
                  placeholder="Nome da instituição"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Endereço</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C]"
                  placeholder="Endereço"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Logótipo</label>
                <div className="flex items-center gap-3">
                  {(logoPreview || logoUrl) && (
                    <div className="w-14 h-14 rounded-xl border border-[#EDE7FF] overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                      <img
                        src={logoPreview || logoUrl}
                        alt="Logo preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-bold text-gray-500 hover:bg-[#f8f7ff] hover:border-[#4B187C] hover:text-[#4B187C] transition-colors"
                  >
                    <ImageUp className="w-4 h-4" />
                    {logoFile ? 'Alterar imagem' : 'Selecionar imagem'}
                  </button>
                  {(logoPreview || logoUrl) && (
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl('') }}
                      className="px-3 py-2.5 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                    setLogoUrl('')
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-1.5">Formatos aceites: JPG, PNG, WebP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={saving || uploading || !name.trim()} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {uploading ? 'A enviar...' : saving ? 'A criar...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
