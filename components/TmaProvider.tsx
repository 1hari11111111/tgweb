'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface WebAppUser {
  id: string
  username?: string
  balance: number
  role: string
}

interface TmaContextType {
  user: WebAppUser | null
  loading: boolean
  initData: string | null
  upiId: string | null
  refreshUser: () => Promise<void>
}

const TmaContext = createContext<TmaContextType>({
  user: null,
  loading: true,
  initData: null,
  upiId: null,
  refreshUser: async () => {},
})

export const useTma = () => useContext(TmaContext)

export function TmaProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WebAppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initData, setInitData] = useState<string | null>(null)
  const [upiId, setUpiId] = useState<string | null>(null)

  const authenticate = async (data: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: data })
      })
      if (res.ok) {
        const json = await res.json()
        setUser(json.user)
        setUpiId(json.upiId)
      } else {
        console.error('TMA Auth failed', await res.text())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (initData) {
      await authenticate(initData)
    }
  }

  useEffect(() => {
    // Check if running inside Telegram
    const twa = (window as any).Telegram?.WebApp
    if (twa && twa.initData) {
      twa.ready()
      twa.expand()
      setInitData(twa.initData)
      authenticate(twa.initData)
    } else {
      // Mock for desktop browser testing in development
      if (process.env.NODE_ENV === 'development') {
        const mockInitData = 'mock_admin_data'
        setInitData(mockInitData)
        authenticate(mockInitData)
      } else {
        setLoading(false)
      }
    }
  }, [])

  return (
    <TmaContext.Provider value={{ user, loading, initData, upiId, refreshUser }}>
      {children}
    </TmaContext.Provider>
  )
}
