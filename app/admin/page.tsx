'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Key, Percent, Save, Eye, EyeOff,
  CheckCircle, AlertTriangle, Lock, ArrowLeft, Loader2, DollarSign, Wallet, QrCode, Users, ShoppingBag, BarChart3, Settings as SettingsIcon, LogOut, ChevronRight, LayoutDashboard, Globe
} from 'lucide-react'

// Interfaces
interface SettingsData {
  lztApiToken: string
  profitPercent: number
  inrExchangeRate: number
  upiId: string
  adminChatId: string
  mainChannelId: string
  hasToken: boolean
}

interface Deposit {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  reference: string
  createdAt: string
  user: { username: string | null }
}

interface User {
  id: string
  username: string | null
  balance: number
  role: string
  createdAt: string
  _count: { purchases: number, transactions: number }
}

interface Purchase {
  id: string
  userId: string
  user: { username: string | null }
  lztItemId: number
  countryName: string | null
  priceInr: number
  status: string
  createdAt: string
}

interface AdminStats {
  totalUsers: number
  totalRevenue: number
  totalPurchases: number
  todayPurchases: number
  totalSoldAmount: number
  activeUserBalance: number
}

type TabType = 'overview' | 'users' | 'deposits' | 'purchases' | 'settings'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Data states
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)

  // Settings inputs
  const [newToken, setNewToken] = useState('')
  const [newProfit, setNewProfit] = useState('')
  const [newExchangeRate, setNewExchangeRate] = useState('')
  const [newUpiId, setNewUpiId] = useState('')
  const [newAdminChatId, setNewAdminChatId] = useState('')
  const [newMainChannelId, setNewMainChannelId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogin = async () => {
    if (!password.trim()) {
      setAuthError('Please enter the admin password')
      return
    }

    setAuthLoading(true)
    setAuthError('')

    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-password': password },
      })

      if (!res.ok) {
        setAuthError('Invalid password')
        setAuthLoading(false)
        return
      }

      const data: SettingsData = await res.json()
      setSettings(data)
      setNewProfit(String(data.profitPercent))
      setNewExchangeRate(String(data.inrExchangeRate))
      setNewUpiId(data.upiId || '')
      setNewAdminChatId(data.adminChatId || '')
      setNewMainChannelId(data.mainChannelId || '')
      setIsAuthed(true)
      
      // Load all data
      fetchStats()
      fetchUsers()
      fetchDeposits()
      fetchPurchases()
    } catch {
      setAuthError('Connection error. Try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch functions
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-password': password } })
      if (res.ok) setStats(await res.json())
    } catch (e) {}
  }
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': password } })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {}
  }
  const fetchDeposits = async () => {
    try {
      const res = await fetch('/api/admin/deposits', { headers: { 'x-admin-password': password } })
      if (res.ok) {
        const data = await res.json()
        setDeposits(Array.isArray(data) ? data : [])
      }
    } catch (e) {}
  }
  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/admin/purchases', { headers: { 'x-admin-password': password } })
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
      }
    } catch (e) {}
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          lztApiToken: newToken,
          profitPercent: newProfit,
          inrExchangeRate: newExchangeRate,
          upiId: newUpiId,
          adminChatId: newAdminChatId,
          mainChannelId: newMainChannelId
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setNewToken('')
        showToast('success', 'Settings saved successfully')
      } else {
        showToast('error', 'Failed to save settings')
      }
    } catch {
      showToast('error', 'Connection error')
    } finally {
      setSaving(false)
    }
  }

  const handleDepositAction = async (transactionId: string, actionType: 'approve' | 'reject') => {
    const action = actionType === 'approve' ? 'APPROVE' : 'REJECT'
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, transactionId, action })
      })

      if (res.ok) {
        showToast('success', `Deposit ${action}d`)
        fetchDeposits()
        fetchStats()
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Failed to update deposit')
      }
    } catch {
      showToast('error', 'Connection error')
    }
  }

  if (!isAuthed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1f2937, #111827)', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(12px)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }}>
            <Shield size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>Command Center</h1>
          <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '32px' }}>Enter your master credentials to proceed.</p>
          
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(17, 24, 39, 0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: '#fff', fontSize: '16px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)' }}
              onFocus={(e) => e.target.style.border = '1px solid #ef4444'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.05)'}
            />
          </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '14px', marginBottom: '24px', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <AlertTriangle size={16} /> {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={authLoading}
            style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)', transition: 'transform 0.1s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {authLoading ? <Loader2 size={20} className="spinner" /> : 'Authenticate'}
          </button>
          
          <a href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#9ca3af', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
            &larr; Return to Marketplace
          </a>
        </div>
      </div>
    )
  }

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
        width: '100%', textAlign: 'left', background: activeTab === id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        border: 'none', borderRadius: '12px', color: activeTab === id ? '#ef4444' : '#9ca3af',
        fontWeight: activeTab === id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s'
      }}
      onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={20} /> {label}
    </button>
  )

  const cardStyle = {
    background: 'rgba(31, 41, 55, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }

  const statCardStyle = {
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '20px',
    padding: '28px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1219', color: '#e5e7eb', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000, animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: '300px', background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
              <LayoutDashboard size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Nexus Admin</h1>
              <a href="/" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>&larr; Exit to Store</a>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Dashboard</div>
          <TabButton id="overview" icon={BarChart3} label="Overview" />
          <TabButton id="users" icon={Users} label="Users" />
          <TabButton id="deposits" icon={Wallet} label="Deposits" />
          <TabButton id="purchases" icon={ShoppingBag} label="Purchases" />
          
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px', marginBottom: '8px', paddingLeft: '12px' }}>System</div>
          <TabButton id="settings" icon={SettingsIcon} label="Settings" />
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => { setIsAuthed(false); setPassword('') }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: '#9ca3af', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <LogOut size={20} /> Terminate Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '48px 56px', overflowY: 'auto' }}>
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-1px' }}>Overview</h2>
            <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '16px' }}>Real-time metrics and platform statistics.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div style={statCardStyle}>
                <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} color="#10b981" /> TOTAL REVENUE (INR)
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>₹{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}><Wallet size={120} /></div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#3b82f6" /> TOTAL USERS
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{stats?.totalUsers || 0}</div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}><Users size={120} /></div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} color="#ef4444" /> TOTAL PURCHASES
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{stats?.totalPurchases || 0}</div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}><ShoppingBag size={120} /></div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#f59e0b" /> TODAY'S SALES
                </div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{stats?.todayPurchases || 0}</div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}><BarChart3 size={120} /></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px', color: '#fff', letterSpacing: '-1px' }}>User Management</h2>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Purchases</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px 32px', fontWeight: 600, color: '#fff' }}>{u.username || `User #${u.id}`}</td>
                      <td style={{ padding: '20px 32px', color: '#10b981', fontWeight: 700 }}>₹{u.balance.toFixed(2)}</td>
                      <td style={{ padding: '20px 32px', fontWeight: 500 }}>{u._count.purchases}</td>
                      <td style={{ padding: '20px 32px', color: '#9ca3af', fontSize: '14px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px', color: '#fff', letterSpacing: '-1px' }}>Deposit Requests</h2>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Reference / UTR</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px 32px', fontWeight: 600, color: '#fff' }}>{d.user?.username || 'Unknown'}</td>
                      <td style={{ padding: '20px 32px', fontWeight: 700, color: '#10b981' }}>₹{d.amount.toFixed(2)}</td>
                      <td style={{ padding: '20px 32px', fontFamily: 'monospace', color: '#9ca3af' }}>{d.reference}</td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                          background: d.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : d.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: d.status === 'APPROVED' ? '#10b981' : d.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        {d.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleDepositAction(d.id, 'approve')} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => handleDepositAction(d.id, 'reject')} style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>No deposit requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px', color: '#fff', letterSpacing: '-1px' }}>All Purchases</h2>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Item ID</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Country</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Price (INR)</th>
                    <th style={{ padding: '20px 32px', color: '#9ca3af', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '20px 32px', fontWeight: 600, color: '#fff' }}>{p.user?.username || 'Unknown'}</td>
                      <td style={{ padding: '20px 32px', fontFamily: 'monospace', color: '#9ca3af' }}>{p.lztItemId}</td>
                      <td style={{ padding: '20px 32px', color: '#e5e7eb' }}>{p.countryName || '-'}</td>
                      <td style={{ padding: '20px 32px', fontWeight: 700, color: '#10b981' }}>₹{p.priceInr.toFixed(2)}</td>
                      <td style={{ padding: '20px 32px', color: '#9ca3af', fontSize: '14px' }}>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>No purchases yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="fade-in" style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px', color: '#fff', letterSpacing: '-1px' }}>Platform Settings</h2>
            
            <div style={{ display: 'grid', gap: '32px' }}>
              
              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={20} color="#3b82f6" /> API Configuration
                </h3>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LZT API Token</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showToken ? 'text' : 'password'}
                      placeholder={settings?.lztApiToken || 'Enter new token'}
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      style={{ width: '100%', padding: '16px 48px 16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                      onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                      onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                    />
                    <button onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {settings?.hasToken && !newToken && (
                    <div style={{ fontSize: '13px', color: '#10b981', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Active token securely stored
                    </div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Percent size={20} color="#10b981" /> Financial Settings
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit Margin (%)</label>
                    <input
                      type="number"
                      value={newProfit}
                      onChange={(e) => setNewProfit(e.target.value)}
                      style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>USD to INR Rate</label>
                    <input
                      type="number"
                      value={newExchangeRate}
                      onChange={(e) => setNewExchangeRate(e.target.value)}
                      style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={20} color="#f59e0b" /> Operations & Links
                </h3>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deposit UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@upi"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Chat URL</label>
                      <input
                        type="text"
                        placeholder="https://t.me/support"
                        value={newAdminChatId}
                        onChange={(e) => setNewAdminChatId(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Main Channel URL</label>
                      <input
                        type="text"
                        placeholder="https://t.me/channel"
                        value={newMainChannelId}
                        onChange={(e) => setNewMainChannelId(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  style={{ padding: '16px 32px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)', transition: 'transform 0.1s' }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {saving ? <Loader2 size={20} className="spinner" /> : <><Save size={20} /> Save Configuration</>}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
