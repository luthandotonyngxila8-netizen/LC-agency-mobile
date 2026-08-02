import { useCallback, useEffect, useState } from 'react'
import { authProvider, type User } from '../lib/auth'

/**
 * Who is signed in. Mirrors `useTasks`: every mutation goes through the
 * provider and then re-reads it, so swapping in real auth changes nothing here.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setUser(await authProvider.currentUser())
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await authProvider.signIn(email, password)
      await refresh()
    },
    [refresh],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      await authProvider.signUp(name, email, password)
      await refresh()
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    await authProvider.signOut()
    await refresh()
  }, [refresh])

  return { user, loading, signIn, signUp, signOut }
}
