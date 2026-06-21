'use client'

import { useState, useRef, KeyboardEvent } from 'react'

const SENSITIVE_WORDS = [
  'iban', 'paypal', 'wire transfer',
  'whatsapp', 'wpp', 'wp', 'zap', 'whats',
  'telemóvel', 'telemovel', 'telefone', 'phone', 'número', 'numero',
  'contacto', 'contact', 'ligar', 'chamar', 'call',
  'transferência', 'transferencia', 'transfer',
  'mb way', 'mbway', 'multicaixa', 'express', 'kwik',
  'conta bancária', 'conta bancaria', 'número de conta',
  'bai', 'bfa', 'atlântico', 'atlantico', 'sol', 'bic', 'swift',
  'gmail', 'hotmail', 'outlook', 'yahoo',
  'instagram', 'facebook', 'telegram', 'tiktok', 'snapchat',
]

const PRICE_PATTERNS = [
  /\d+\s*(kz|kzs|kwanza|aoa)/i,
  /\d+\s*000/,
  /(aceito|pago|ofereço|proponho|quanto|preço|valor|custa|vendo)\s+\w*\s*\d+/i,
  /\d+\s*(por|pelo|pela)/i,
]

function hasSensitiveContent(text: string): boolean {
  return SENSITIVE_WORDS.some(word => text.toLowerCase().includes(word))
}

function hasPriceContent(text: string): boolean {
  return PRICE_PATTERNS.some(pattern => pattern.test(text))
}

// =============================================
// COMPRESSÃO DE IMAGEM — canvas antes do upload
// =============================================

async function compressImage(file: File, maxWidth = 1280, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed.size < file.size ? compressed : file)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// =============================================
// PROPS
// =============================================

interface MessageInputProps {
  conversationId: string
  currentUserId: string
  disabled?: boolean
  isSending?: boolean
  isBuyer?: boolean
  onSendMessage: (content: string) => Promise<{ error: string | null } | undefined>
  onSendImage: (file: File) => Promise<{ error: string | null } | undefined>
  onMakeOffer?: () => void
}

// =============================================
// COMPONENTE
// =============================================

export default function MessageInput({
  currentUserId: _currentUserId,
  disabled = false,
  isSending = false,
  isBuyer = false,
  onSendMessage,
  onSendImage,
  onMakeOffer,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [sensitiveWarning, setSensitiveWarning] = useState(false)
  const [priceHint, setPriceHint] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string; compressed: boolean } | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // ── Texto ──────────────────────────────────────────────────────────────

  async function handleSend() {
    const content = text.trim()
    if (!content || isSending) return
    setText('')
    setSensitiveWarning(false)
    setPriceHint(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await onSendMessage(content)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextChange(value: string) {
    setText(value)
    setSensitiveWarning(hasSensitiveContent(value))
    setPriceHint(isBuyer && hasPriceContent(value))
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  // ── Imagem ─────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setImageError('Formato não suportado. Usa JPG, PNG ou WebP.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Imagem demasiado grande. Máximo 5 MB.')
      e.target.value = ''
      return
    }

    setIsCompressing(true)

    const compressed = await compressImage(file)
    const wasCompressed = compressed.size < file.size

    const url = URL.createObjectURL(compressed)
    setImagePreview({ file: compressed, url, compressed: wasCompressed })
    setIsCompressing(false)
    e.target.value = ''
  }

  function cancelImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    setImageError(null)
  }

  async function handleSendImage() {
    if (!imagePreview || isSending) return
    const file = imagePreview.file
    cancelImage()
    const result = await onSendImage(file)
    if (result?.error) setImageError(result.error)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (disabled) {
    return (
      <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm text-gray-400">Esta conversa está encerrada</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Aviso de conteúdo sensível */}
      {sensitiveWarning && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>Detectámos informação de contacto externo. Por segurança, mantém a negociação dentro da plataforma.</span>
        </div>
      )}

      {/* Banner de sugestão de proposta */}
      {priceHint && !sensitiveWarning && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F5F0FF] border border-[#EDE7FF] rounded-lg">
          <div className="flex items-center gap-2 text-xs text-[#4B187C]">
            <span>💡</span>
            <span>Estás a propor um preço? Usa o botão oficial para formalizar.</span>
          </div>
          {onMakeOffer && (
            <button
              onClick={onMakeOffer}
              className="shrink-0 text-[10px] font-semibold text-[#4B187C] border border-[#4B187C] rounded-lg px-2 py-1 hover:bg-[#4B187C] hover:text-white transition-colors"
            >
              Propor preço
            </button>
          )}
        </div>
      )}

      {/* A comprimir */}
      {isCompressing && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F9F7FF] border border-[#EDE7FF] rounded-xl text-xs text-[#4B187C]">
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>A optimizar imagem…</span>
        </div>
      )}

      {/* Preview da imagem */}
      {imagePreview && (
        <div className="flex items-end gap-3 p-3 bg-[#F9F7FF] border border-[#EDE7FF] rounded-xl">
          <div className="relative shrink-0">
            <img
              src={imagePreview.url}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-[#EDE7FF]"
            />
            <button
              onClick={cancelImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-gray-900 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-medium truncate">{imagePreview.file.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {(imagePreview.file.size / 1024).toFixed(0)} KB
              {imagePreview.compressed && (
                <span className="ml-1.5 text-green-600">✓ optimizada</span>
              )}
            </p>
          </div>
          <button
            onClick={handleSendImage}
            disabled={isSending}
            className="shrink-0 px-4 py-2 bg-[#4B187C] text-white text-xs font-semibold rounded-xl hover:bg-[#3a1260] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : 'Enviar'}
          </button>
        </div>
      )}

      {/* Erro de imagem */}
      {imageError && (
        <p className="text-xs text-red-500 px-1">{imageError}</p>
      )}

      {/* Input principal */}
      <div className="flex items-end gap-2">

        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isSending || !!imagePreview || isCompressing}
          title="Enviar imagem"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#F9F7FF] text-[#4B187C] hover:bg-[#EDE7FF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </button>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Textarea */}
        <div className="flex-1 flex items-end gap-2 bg-[#F9F7FF] border border-[#EDE7FF] rounded-xl px-3 py-2 focus-within:border-[#4B187C] focus-within:ring-2 focus-within:ring-[#4B187C]/10 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreve uma mensagem…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="w-7 h-7 rounded-lg bg-[#4B187C] text-white flex items-center justify-center shrink-0 hover:bg-[#3a1260] disabled:opacity-30 disabled:cursor-not-allowed transition-all self-end"
            aria-label="Enviar mensagem"
          >
            {isSending ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {text.length > 0 && !imagePreview && (
        <p className="text-[10px] text-gray-400 text-right pr-1">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      )}
    </div>
  )
}