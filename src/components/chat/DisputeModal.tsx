'use client'

import { useState, useEffect } from 'react'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<{ error: string | null } | undefined>
  existingDispute?: {
    status: string
    reason: string
    resolution: string | null
  } | null
}

const MIN_LENGTH = 20

export default function DisputeModal({
  isOpen,
  onClose,
  onSubmit,
  existingDispute,
}: DisputeModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isValid = reason.trim().length >= MIN_LENGTH

  async function handleSubmit() {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const result = await onSubmit(reason.trim())

    setIsSubmitting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
  }

  const statusLabel: Record<string, { label: string; className: string }> = {
    open:       { label: 'Em análise',  className: 'bg-amber-100 text-amber-700' },
    resolved:   { label: 'Resolvida',   className: 'bg-green-100 text-green-700' },
    cancelled:  { label: 'Cancelada',   className: 'bg-gray-100 text-gray-500' },
    frivolous:  { label: 'Indeferida',  className: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {existingDispute ? (
          // ── Disputa já existente — mostrar estado ──────────────────────
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Disputa desta conversa</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <span className={[
              'inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3',
              statusLabel[existingDispute.status]?.className ?? 'bg-gray-100 text-gray-500',
            ].join(' ')}>
              {statusLabel[existingDispute.status]?.label ?? existingDispute.status}
            </span>

            <p className="text-sm text-gray-600 mb-1 font-medium">Motivo reportado:</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {existingDispute.reason}
            </p>

            {existingDispute.resolution && (
              <p className="text-xs text-gray-400 mt-3">
                Resultado: {existingDispute.resolution}
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full mt-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </>
        ) : success ? (
          // ── Sucesso ──────────────────────────────────────────────────────
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Disputa registada</h3>
            <p className="text-sm text-gray-500 mb-5">
              Um admin vai rever esta conversa e responder em breve.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#4B187C] rounded-xl hover:bg-[#3a1260] transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          // ── Formulário ───────────────────────────────────────────────────
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-900">Abrir disputa</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Descreve o que correu mal nesta transação. Um admin vai rever o histórico da conversa.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: O produto recebido não correspondia ao anunciado…"
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4B187C]/20 focus:border-[#4B187C] transition-all"
            />

            <div className="flex items-center justify-between mt-1.5 mb-4">
              <span className={[
                'text-xs',
                isValid ? 'text-gray-400' : 'text-amber-500',
              ].join(' ')}>
                {reason.trim().length}/{MIN_LENGTH} caracteres mínimos
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#4B187C] rounded-xl hover:bg-[#3a1260] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'A enviar…' : 'Abrir disputa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}