'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import FilterPanel, { FilterValues } from '@/components/FilterPanel'
import ResultsSection from '@/components/ResultsSection'
import WalletModal from '@/components/WalletModal'
import LoginModal from '@/components/LoginModal'
import Sidebar from '@/components/Sidebar'
import { useTma } from '@/components/TmaProvider'
import { useAuth } from '@/components/TmaProvider'
import { TelegramAccount } from '@/lib/lzt'
import { Wallet, Menu, X, User, ShieldAlert, LogIn, LogOut, MessageCircle, Megaphone } from 'lucide-react'

interface SearchResult {
  items: TelegramAccount[]
  totalItems: number
  hasNextPage: boolean
  perPage: number
  page: number
  inrExchangeRate?: number
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterValues>({})
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('pdate_to_down')
  const [hasFetched, setHasFetched] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const { user } = useTma()
  const { logout } = useAuth()
  const abortRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const buildQueryString = useCallback((f: FilterValues, page: number, sort: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('order_by', sort)
    params.set('currency', 'usd')
    if (f.pmin) params.set('pmin', String(f.pmin))
    if (f.pmax) params.set('pmax', String(f.pmax))
    if (f.premium && f.premium !== 'nomatter') params.set('premium', f.premium)
    if (f.password && f.password !== 'nomatter') params.set('password', f.password)
    if (f.spam && f.spam !== 'nomatter') params.set('spam', f.spam)
    if (f.email && f.email !== 'nomatter') params.set('email', f.email)
    if (f.daybreak) params.set('daybreak', String(f.daybreak))
    if (f.origin) params.set('origin[]', f.origin)
    if (f.country && f.country.length > 0) {
      f.country.forEach(c => params.append('country[]', c))
    }
    return params.toString()
  }, [])

  const fetchAccounts = useCallback(async (f: FilterValues, page: number, sort: string) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const qs = buildQueryString(f, page, sort)
      const res = await fetch(`/api/telegram?${qs}`, { signal: controller.signal })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const data: SearchResult = await res.json()
      setResults(data)
      setHasFetched(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unable to fetch accounts.')
    } finally {
      setLoading(false)
    }
  }, [buildQueryString])

  useEffect(() => { fetchAccounts({}, 1, 'pdate_to_down') }, [])

  const handleFetch = () => { setCurrentPage(1); fetchAccounts(filters, 1, sortBy) }
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchAccounts(filters, page, sortBy)
    resultsRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    if (hasFetched) { setCurrentPage(1); fetchAccounts(filters, 1, sort) }
  }
  const handleReset = () => {
    setFilters({})
    setResults(null)
    setError(null)
    setHasFetched(false)
    setCurrentPage(1)
  }
  const handleRetry = () => fetchAccounts(filters, currentPage, sortBy)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
        padding: '0 20px',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 5L2 12.5L9 13.5M21 5L18.5 20L9 13.5M21 5L9 13.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>TGAccounts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <button
                onClick={() => setShowWallet(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <Wallet size={14} color="var(--accent)" /> ₹ {user.balance.toFixed(2)}
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                <LogIn size={14} /> Login
              </button>
            )}
            
            <button
              onClick={() => setShowSidebar(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Sidebar (Drawer) ── */}
      {showSidebar && (
        <Sidebar 
          user={user} 
          onClose={() => setShowSidebar(false)} 
          onLogin={() => { setShowSidebar(false); setShowLogin(true) }} 
          onLogout={logout}
          settings={settings}
        />
      )}

      {/* ── Body ── */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px 20px 60px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <FilterPanel
            values={filters}
            onChange={setFilters}
            onFetch={handleFetch}
            onReset={handleReset}
            loading={loading}
          />
        </div>

        <div ref={resultsRef}>
          <ResultsSection
            results={results}
            loading={loading}
            error={error}
            hasFetched={hasFetched}
            currentPage={currentPage}
            sortBy={sortBy}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </div>
      </div>

      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
