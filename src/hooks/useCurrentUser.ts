import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

let cachedUserId: string | null = null
let cachedUserPromise: Promise<string | null> | null = null
let listenerRegistered = false

// Garante que o listener de auth state só é registado uma vez,
// mesmo que getCachedUserId() seja chamado antes de qualquer componente usar o hook.
function ensureAuthListener() {
  if (listenerRegistered) return
  listenerRegistered = true

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null
    cachedUserPromise = null
  })
}

// Garante que getUser() só é chamado uma vez, depois reutiliza o resultado.
// Invalida automaticamente quando a sessão muda (login/logout/troca de conta).
export async function getCachedUserId(): Promise<string | null> {
  ensureAuthListener()

  if (cachedUserId) return cachedUserId
  if (cachedUserPromise) return cachedUserPromise

  cachedUserPromise = supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUserId = user?.id ?? null
    cachedUserPromise = null
    return cachedUserId
  })

  return cachedUserPromise
}

// Invalidar cache manualmente — útil para chamar logo após o login
export function clearCachedUserId() {
  cachedUserId = null
  cachedUserPromise = null
}

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ensureAuthListener()

    getCachedUserId().then((id) => {
      if (mounted) setUserId(id)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedUserId = session?.user?.id ?? null
      if (mounted) setUserId(cachedUserId)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return userId
}