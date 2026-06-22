'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Building2,
  CheckCircle,
  Clock,
  GraduationCap,
  Mail,
  Package,
  Phone,
  Shield,
  Star,
  Store,
  UserCheck,
  UserCog,
  UserX,
  XCircle,
} from 'lucide-react'
import {
  getUserData,
  getInstitutions,
  getClassesByInstitution,
  toggleAdminRole,
  toggleSellerVerification,
  banUser,
  unbanUser,
  updateAcademicData,
  updateAdminNotes,
} from './actions'
import type { UserFullData } from './actions'

// ─── helpers ───────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatPrice(v: number | null): string {
  if (v == null) return '-'
  return `${Number(v).toFixed(2)} €`
}

const statusCfg: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-600', icon: UserCheck },
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-600', icon: Clock },
  suspended: { label: 'Suspenso', className: 'bg-red-50 text-red-600', icon: UserX },
}

const orderStatusCfg: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Confirmado', className: 'bg-blue-50 text-blue-600' },
  delivered: { label: 'Entregue', className: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
}

const productTypeLabel: Record<string, string> = {
  digital_material: 'Material Digital',
  service: 'Serviço',
  physical_product: 'Produto Físico',
}

// ─── Spinner ───────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
    </div>
  )
}

// ─── StatusBadge ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const cfg = statusCfg[status || ''] || { label: status || 'Desconhecido', className: 'bg-gray-50 text-gray-500', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function OrderStatusBadge({ status }: { status: string | null }) {
  const cfg = orderStatusCfg[status || ''] || { label: status || 'Desconhecido', className: 'bg-gray-50 text-gray-500' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserFullData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // editing state
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const [banDialog, setBanDialog] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)

  const [editingAcademic, setEditingAcademic] = useState(false)
  const [acadInst, setAcadInst] = useState('')
  const [acadClass, setAcadClass] = useState('')
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string; grade: number | null; academic_year: { id: string; label: string } | null }[]>([])
  const [savingAcademic, setSavingAcademic] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getUserData(userId)
    if (res.success) {
      setData(res.data)
    } else {
      setError(res.error)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  // load institutions for academic edit
  const openAcademicEdit = useCallback(async () => {
    setEditingAcademic(true)
    const [instRes] = await Promise.all([getInstitutions()])
    if (instRes.success) setInstitutions(instRes.data)
    setAcadInst(data?.user?.institution_id || '')
    setAcadClass(data?.student?.class_id || '')
  }, [data])

  const handleInstitutionChange = useCallback(async (instId: string) => {
    setAcadInst(instId)
    setAcadClass('')
    if (instId) {
      const res = await getClassesByInstitution(instId)
      if (res.success) setClasses(res.data)
      else setClasses([])
    } else {
      setClasses([])
    }
  }, [])

  const handleSaveAcademic = useCallback(async () => {
    setSavingAcademic(true)
    const res = await updateAcademicData(userId, acadInst, acadClass || null)
    if (res.success) {
      showToast('success', 'Dados académicos atualizados.')
      setEditingAcademic(false)
      loadData()
    } else {
      showToast('error', res.error)
    }
    setSavingAcademic(false)
  }, [userId, acadInst, acadClass, showToast, loadData])

  const handleToggleRole = useCallback(async () => {
    setToggleLoading('role')
    const res = await toggleAdminRole(userId)
    if (res.success) {
      showToast('success', 'Cargo atualizado.')
      loadData()
    } else {
      showToast('error', res.error)
    }
    setToggleLoading(null)
  }, [userId, showToast, loadData])

  const handleToggleSeller = useCallback(async () => {
    setToggleLoading('seller')
    const res = await toggleSellerVerification(userId)
    if (res.success) {
      showToast('success', 'Verificação de vendedor atualizada.')
      loadData()
    } else {
      showToast('error', res.error)
    }
    setToggleLoading(null)
  }, [userId, showToast, loadData])

  const handleBan = useCallback(async () => {
    if (!banReason.trim()) return
    setBanning(true)
    const res = await banUser(userId, banReason)
    if (res.success) {
      showToast('success', 'Utilizador banido.')
      setBanDialog(false)
      setBanReason('')
      loadData()
    } else {
      showToast('error', res.error)
    }
    setBanning(false)
  }, [userId, banReason, showToast, loadData])

  const handleUnban = useCallback(async () => {
    setToggleLoading('unban')
    const res = await unbanUser(userId)
    if (res.success) {
      showToast('success', 'Ban removido.')
      loadData()
    } else {
      showToast('error', res.error)
    }
    setToggleLoading(null)
  }, [userId, showToast, loadData])

  const handleSaveNotes = useCallback(async () => {
    setSavingNotes(true)
    const res = await updateAdminNotes(userId, notesDraft)
    if (res.success) {
      showToast('success', 'Notas guardadas.')
      setEditingNotes(false)
      loadData()
    } else {
      showToast('error', res.error)
    }
    setSavingNotes(false)
  }, [userId, notesDraft, showToast, loadData])

  // ── loading / error ──────────────────────────────────────────────

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-xs font-bold hover:bg-[#3d1266] transition-colors">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  const { user, student, products, ordersAsBuyer, ordersAsSeller } = data
  const isSuspended = user.status === 'suspended'
  const isAdmin = user.role === 'admin'

  // ── render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* header */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
        <div className="flex items-start gap-4">
          <Link href="/admin/utilizadores" className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#EDE7FF] text-gray-400 hover:text-[#4B187C] hover:border-[#4B187C] transition-colors shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-full bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center font-black text-xl shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl font-black text-gray-800">{user.full_name}</h2>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                @{user.enrollment_code}
                {user.email && <span className="ml-3">• {user.email}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isAdmin ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                {isAdmin ? 'Admin' : 'Estudante'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* user info */}
          <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-[#4B187C]" />
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Email" value={user.email || '-'} icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoField label="Telemóvel" value={user.phone || '-'} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoField label="Código de Inscrição" value={user.enrollment_code} icon={<GraduationCap className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoField label="Instituição" value={user.institution?.name || '-'} icon={<Building2 className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoField label="Verificado" value={user.is_verified ? 'Sim' : 'Não'} icon={<CheckCircle className={`w-3.5 h-3.5 ${user.is_verified ? 'text-emerald-400' : 'text-gray-300'}`} />} />
              <InfoField label="Registo" value={formatDate(user.created_at)} icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} />
            </div>
            {user.ban_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[11px] font-bold text-red-600 mb-1">Motivo de banimento:</p>
                <p className="text-xs text-red-500">{user.ban_reason}</p>
              </div>
            )}
          </div>

          {/* student info */}
          {student && (
            <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
              <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#4B187C]" />
                Dados Académicos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Turma" value={student.class ? `${student.class.name} (${student.class.grade}º)` : '-'} icon={<GraduationCap className="w-3.5 h-3.5 text-gray-400" />} />
                <InfoField label="Ano de Inscrição" value={student.enrollment_year?.toString() || '-'} icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} />
                <InfoField label="Vendedor" value={student.is_seller ? 'Sim' : 'Não'} icon={<Store className="w-3.5 h-3.5 text-gray-400" />} />
                <InfoField label="Vendedor Verificado" value={student.is_verified_seller ? 'Sim' : 'Não'} icon={<CheckCircle className={`w-3.5 h-3.5 ${student.is_verified_seller ? 'text-emerald-400' : 'text-gray-300'}`} />} />
                <InfoField label="Classificação" value={student.rating != null && student.rating > 0 ? student.rating.toFixed(1) : '-'} icon={<Star className="w-3.5 h-3.5 text-gray-400" />} />
              </div>
            </div>
          )}

          {/* admin notes */}
          <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-[#4B187C]" />
                Notas de Administrador
              </h3>
              {!editingNotes && (
                <button onClick={() => { setNotesDraft(user.admin_notes || ''); setEditingNotes(true) }} className="text-[11px] font-bold text-[#4B187C] hover:text-[#3d1266] transition-colors">
                  Editar
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#4B187C] resize-none"
                  placeholder="Adicionar notas internas sobre este utilizador..."
                />
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setEditingNotes(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSaveNotes} disabled={savingNotes} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                    {savingNotes ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-sans whitespace-pre-wrap">{user.admin_notes || '—'}</p>
            )}
          </div>

          {/* products */}
          <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 pb-0">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-[#4B187C]" />
                Produtos ({products.length})
              </h3>
            </div>
            {products.length === 0 ? (
              <div className="px-6 pb-6">
                <p className="text-xs text-gray-400 font-sans">Nenhum produto registado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-[#EDE7FF] bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Título</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Tipo</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Categoria</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Preço</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                      <th className="w-10 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7FF]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f8f7ff] transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800">{p.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-gray-500">{productTypeLabel[p.type] || p.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-gray-500">{p.category?.name || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-bold text-gray-700">{formatPrice(p.price)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.is_approved ? 'Aprovado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/product/${p.id}`} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-[#4B187C] hover:bg-[#EDE7FF] transition-all">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* orders as buyer */}
          <OrdersTable
            title={`Pedidos como Comprador (${ordersAsBuyer.length})`}
            orders={ordersAsBuyer}
            showBuyer={false}
          />

          {/* orders as seller */}
          <OrdersTable
            title={`Pedidos como Vendedor (${ordersAsSeller.length})`}
            orders={ordersAsSeller}
            showBuyer
          />
        </div>

        {/* ─── right column ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* admin actions */}
          <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4B187C]" />
              Ações de Administrador
            </h3>
            <div className="flex flex-col gap-3">

              {/* toggle admin */}
              <button onClick={handleToggleRole} disabled={toggleLoading === 'role'} className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-[#EDE7FF] hover:bg-[#f8f7ff] transition-colors disabled:opacity-50">
                <span className="text-xs font-bold text-gray-700">
                  {isAdmin ? 'Remover cargo de admin' : 'Promover a administrador'}
                </span>
                {toggleLoading === 'role' ? (
                  <div className="w-4 h-4 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
                ) : (
                  <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-400' : 'text-[#4B187C]'}`} />
                )}
              </button>

              {/* toggle seller verification */}
              <button onClick={handleToggleSeller} disabled={toggleLoading === 'seller'} className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-[#EDE7FF] hover:bg-[#f8f7ff] transition-colors disabled:opacity-50">
                <span className="text-xs font-bold text-gray-700">
                  {student?.is_verified_seller ? 'Remover verificação de vendedor' : 'Verificar como vendedor'}
                </span>
                {toggleLoading === 'seller' ? (
                  <div className="w-4 h-4 border-2 border-[#EDE7FF] border-t-[#4B187C] rounded-full animate-spin" />
                ) : (
                  <Store className={`w-4 h-4 ${student?.is_verified_seller ? 'text-emerald-500' : 'text-gray-300'}`} />
                )}
              </button>

              {/* unban */}
              {isSuspended && (
                <button onClick={handleUnban} disabled={toggleLoading === 'unban'} className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  <span className="text-xs font-bold text-emerald-700">Remover banimento</span>
                  {toggleLoading === 'unban' ? (
                    <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              )}

              {/* ban */}
              {!isSuspended && (
                <button onClick={() => setBanDialog(true)} className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
                  <span className="text-xs font-bold text-red-700">Banir utilizador</span>
                  <Ban className="w-4 h-4 text-red-500" />
                </button>
              )}

              {/* edit academic data */}
              <button onClick={openAcademicEdit} className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-[#EDE7FF] hover:bg-[#f8f7ff] transition-colors">
                <span className="text-xs font-bold text-gray-700">Editar dados académicos</span>
                <GraduationCap className="w-4 h-4 text-[#4B187C]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ban dialog ────────────────────────────────────────────── */}
      {banDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setBanDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE7FF] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-gray-800 mb-1">Banir Utilizador</h3>
            <p className="text-xs text-gray-400 font-sans mb-4">O utilizador ficará com o estado &quot;Suspenso&quot; e a sessão será invalidada.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-red-400 resize-none mb-4"
              placeholder="Motivo do banimento (obrigatório)..."
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => { setBanDialog(false); setBanReason('') }} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleBan} disabled={banning || !banReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[11px] font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {banning ? 'A banir...' : 'Banir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── academic edit dialog ──────────────────────────────────── */}
      {editingAcademic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingAcademic(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE7FF] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-gray-800 mb-4">Editar Dados Académicos</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Instituição</label>
                <select
                  value={acadInst}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
                >
                  <option value="">Selecionar instituição...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              {acadInst && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Turma</label>
                  <select
                    value={acadClass}
                    onChange={(e) => setAcadClass(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#EDE7FF] rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:border-[#4B187C] appearance-none bg-white"
                  >
                    <option value="">Sem turma</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade}º) — {c.academic_year?.label || ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <button onClick={() => setEditingAcademic(false)} className="px-4 py-2 border border-[#EDE7FF] rounded-xl text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveAcademic} disabled={savingAcademic || !acadInst} className="px-4 py-2 bg-[#4B187C] text-white rounded-xl text-[11px] font-bold hover:bg-[#3d1266] transition-colors disabled:opacity-50">
                {savingAcademic ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── sub-components ────────────────────────────────────────────────

function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  )
}

function OrdersTable({ title, orders, showBuyer }: { title: string; orders: UserFullData['ordersAsBuyer'] | UserFullData['ordersAsSeller']; showBuyer: boolean }) {
  if (orders.length === 0) return null

  return (
    <div className="bg-white border border-[#EDE7FF] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-[#4B187C]" />
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-[#EDE7FF] bg-gray-50/50">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">ID</th>
              {showBuyer && <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Comprador</th>}
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE7FF]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[#f8f7ff] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-[11px] font-mono text-gray-500">{o.id.slice(0, 8)}...</span>
                </td>
                {showBuyer && (
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-gray-700">
                      {'buyer' in o && o.buyer ? (o.buyer as { full_name: string }).full_name : '-'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-gray-500 font-sans">{formatDate(o.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
