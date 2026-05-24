'use client'

import { useState, useEffect } from 'react'
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  getUser,
} from '@/lib/auth'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getUser()
      .then((u) => {
        if (mounted) setUser(u)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function signUp(email: string, password: string, nickname: string) {
    await authSignUp(email, password, nickname)
    const u = await getUser()
    setUser(u)
    return u
  }

  async function signIn(email: string, password: string) {
    await authSignIn(email, password)
    const u = await getUser()
    setUser(u)
    return u
  }

  async function signOut() {
    await authSignOut()
    setUser(null)
  }

  return { user, loading, signUp, signIn, signOut }
}
