import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

let cachedUserId: string | null = null
let cachedUserPromise: Promise<string | null> | null = null

// Garante que getUser() só é chamado uma vez, depois reutiliza o resultado
export async function getCachedUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId
  if (cachedUserPromise) return cachedUserPromise

  cachedUserPromise = supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUserId = user?.id ?? null
    cachedUserPromise = null
    return cachedUserId
  })

  return cachedUserPromise
}

// Invalidar cache no logout
export function clearCachedUserId() {
  cachedUserId = null
  cachedUserPromise = null
}

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
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