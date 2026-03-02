'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createSupabaseBrowser, hasSupabaseEnv } from '@/lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const supabase = useMemo(() => {
    if (!hasSupabaseEnv()) return null
    return createSupabaseBrowser()
  }, [])

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    signOut: async () => {
      if (supabase) {
        await supabase.auth.signOut()
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
