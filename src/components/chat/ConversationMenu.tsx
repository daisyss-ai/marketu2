'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// =============================================
// PROPS
// =============================================

interface ConversationMenuProps {
  conversationId: string
  isBlocked?: boolean
  isBlockedByMe?: boolean // true se EU bloqueei, false se fui bloqueado pelo outro
  onViewOfferHistory?: () => void
  onDeleteConversation: () => Promise<{ error: string | null } | undefined>
  onBlockUser: () => Promise<{ error: string | null } | undefined>
  onUnblockUser: () => Promise<{ error: string | null } | undefined>
}

// =============================================
// COMPONENTE
// =============================================

type MenuAction = 'delete' | 'block' | 'unblock' | 'offers'

export default function ConversationMenu({
  isBlocked = false,
  isBlockedByMe = false,
  onViewOfferHistory,
  onDeleteConversation,
  onBlockUser,
  onUnblockUser,
}: ConversationMenuProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeAll()
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAll()
    }
    if (open) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function closeAll() {
    setOpen(false)
    setConfirmDelete(false)
    setConfirmBlock(false)
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setConfirmBlock(false)
      return
    }
    setIsDeleting(true)
    const result = await onDeleteConversation()
    setIsDeleting(false)
    if (!result?.error) {
      setOpen(false)
      router.push('/chat')
    }
  }

  async function handleBlock() {
    if (!confirmBlock) {
      setConfirmBlock(true)
      setConfirmDelete(false)
      return
    }
    setIsBlocking(true)
  const result = await onBlockUser()
  console.log('Resultado do bloqueio:', result) // DEBUG
  setIsBlocking(false)
  setOpen(false)
  setConfirmBlock(false)
  }

  async function handleUnblock() {
    setIsBlocking(true)
    await onUnblockUser()
    setIsBlocking(false)
    setOpen(false)
  }

  function handleAction(action: MenuAction) {
    if (action === 'delete') { handleDelete(); return }
    if (action === 'block') { handleBlock(); return }
    if (action === 'unblock') { handleUnblock(); return }
    if (action === 'offers') { setOpen(false); onViewOfferHistory?.(); return }
  }

  // ── Conteúdo partilhado entre dropdown e bottom sheet ────────────────────
  const MenuContent = () => (
    <div className="flex flex-col py-1">

      {/* Histórico de propostas */}
      <button
        onClick={() => handleAction('offers')}
        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#F9F7FF] transition-colors text-left"
      >
        <span className="text-base">📋</span>
        <span>Ver histórico de propostas</span>
      </button>

      <div className="h-px bg-gray-100 mx-3" />

      {/* Bloquear / Desbloquear utilizador */}
      {isBlockedByMe ? (
        // Eu bloqueei — posso desbloquear
        <>
          <button
            onClick={() => handleAction('unblock')}
            disabled={isBlocking}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#4B187C] hover:bg-[#F9F7FF] transition-colors text-left disabled:opacity-50"
          >
            <span className="text-base">✅</span>
            <span>{isBlocking ? 'A desbloquear…' : 'Desbloquear utilizador'}</span>
          </button>
          <div className="h-px bg-gray-100 mx-3" />
        </>
      ) : isBlocked ? (
        // Fui bloqueado pelo outro — não posso fazer nada
        <>
          <div className="px-4 py-3 text-xs text-gray-400">
            Esta conversa foi bloqueada
          </div>
          <div className="h-px bg-gray-100 mx-3" />
        </>
      ) : confirmBlock ? (
        // Confirmação inline de bloqueio
        <>
          <div className="px-4 py-3 flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              Bloquear impede o envio de mensagens. Podes desbloquear depois.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBlock(false)}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="flex-1 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {isBlocking ? 'A bloquear…' : 'Bloquear'}
              </button>
            </div>
          </div>
          <div className="h-px bg-gray-100 mx-3" />
        </>
      ) : (
        <>
          <button
            onClick={() => handleAction('block')}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#F9F7FF] transition-colors text-left"
          >
            <span className="text-base">🚫</span>
            <span>Bloquear utilizador</span>
          </button>
          <div className="h-px bg-gray-100 mx-3" />
        </>
      )}

      {/* Apagar conversa — com confirmação inline */}
      {confirmDelete ? (
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-xs text-gray-500">Tens a certeza? Só desaparece para ti.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'A apagar…' : 'Apagar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => handleAction('delete')}
          className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
        >
          <span className="text-base">🗑️</span>
          <span>Apagar conversa</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="relative" ref={menuRef}>

      {/* Botão ⋯ */}
      <button
        onClick={() => { setOpen(prev => !prev); setConfirmDelete(false); setConfirmBlock(false) }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-[#F9F7FF] transition-colors"
        aria-label="Opções da conversa"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* DESKTOP — dropdown */}
          <div className="hidden md:block absolute right-0 top-10 w-60 bg-white rounded-xl border border-[#EDE7FF] shadow-lg z-50 overflow-hidden">
            <MenuContent />
          </div>

          {/* MOBILE — bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeAll}
            />

            <div className="relative bg-white rounded-t-2xl shadow-xl animate-slide-up">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Opções</p>
              </div>

              <MenuContent />

              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={closeAll}
                  className="w-full py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
              </div>

              <div className="pb-6" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}