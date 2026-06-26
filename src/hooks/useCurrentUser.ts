import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const supabase = createClient()

let cachedUser: User | null = null
let cachedUserPromise: Promise<User | null> | null = null
let listenerRegistered = false

// Garante que o listener de auth state só é registado uma vez,
// mesmo que getCachedUserId()/getCachedAuthUser() sejam chamados antes de qualquer componente usar o hook.
function ensureAuthListener() {
  if (listenerRegistered) return
  listenerRegistered = true

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ?? null
    cachedUserPromise = null
  })
}

// Garante que getUser() só é chamado uma vez, depois reutiliza o resultado.
// Invalida automaticamente quando a sessão muda (login/logout/troca de conta).
async function getCachedAuthUserInternal(): Promise<User | null> {
  ensureAuthListener()

  if (cachedUser) return cachedUser
  if (cachedUserPromise) return cachedUserPromise

  cachedUserPromise = supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUser = user ?? null
    cachedUserPromise = null
    return cachedUser
  })

  return cachedUserPromise
}

// Devolve o objeto completo do utilizador (email, user_metadata, etc.)
export async function getCachedAuthUser(): Promise<User | null> {
  return getCachedAuthUserInternal()
}

// Devolve só o id — atalho para o caso mais comum
export async function getCachedUserId(): Promise<string | null> {
  const user = await getCachedAuthUserInternal()
  return user?.id ?? null
}

// Invalidar cache manualmente — útil para chamar logo após o login
export function clearCachedUserId() {
  cachedUser = null
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
      cachedUser = session?.user ?? null
      if (mounted) setUserId(cachedUser?.id ?? null)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return userId
}