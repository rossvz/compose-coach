import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return
      if (error) {
        console.error('Failed to get session', error)
      }
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading }
}
