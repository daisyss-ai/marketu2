import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const BUCKET = 'chat-media'

export type UploadResult = {
  url: string | null
  error: string | null
}

export async function uploadChatImage(
  file: File,
  conversationId: string
): Promise<UploadResult> {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Apenas imagens são permitidas.' }
  }

  // Validar tamanho — máx 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'A imagem não pode ter mais de 5MB.' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${conversationId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { upsert: false })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return { url: data.publicUrl, error: null }
}