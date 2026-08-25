'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

interface WebUser {
  id: string
  username: string
  balance: number
  role: string
}

interface AuthContextType {
  user: WebUser | null
  loading: boolean
  upiId: string | null
  login: (username: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  upiId: null,
  login: async () => ({}),
  logout: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Keep useTma as an alias so existing components still work without changes
export const useTma = () => {
  const auth = useAuth()
  return {
    user: auth.user,
    loading: auth.loading,
    initData: auth.user ? 'web_session' : null,  // non-null means logged in
    upiId: auth.upiId,
    refreshUser: auth.refreshUser,
  }
}

export function TmaProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [upiId, setUpiId] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', { method: 'GET' })
      if (res.ok) {
        const json = await res.json()
        if (json.user) {
          setUser(json.user)
          setUpiId(json.upiId || null)
        } else {
          setUser(null)
          setUpiId(null)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()
      if (res.ok && json.user) {
        setUser(json.user)
        setUpiId(json.upiId || null)
        return {}
      }
      return { error: json.error || 'Login failed' }
    } catch {
      return { error: 'Network error' }
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    setUpiId(null)
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  return (
    <AuthContext.Provider value={{ user, loading, upiId, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
