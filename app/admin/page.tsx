'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Key, Percent, Save, Eye, EyeOff,
  CheckCircle, AlertTriangle, Lock, ArrowLeft, Loader2, DollarSign, Wallet, QrCode, Users, ShoppingBag, BarChart3, Settings as SettingsIcon, LogOut, ChevronRight
} from 'lucide-react'

// Interfaces
interface SettingsData {
  lztApiToken: string
  profitPercent: number
  inrExchangeRate: number
  upiId: string
  adminChatId: string
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
          adminChatId: newAdminChatId
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={32} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Admin Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Enter the admin password to access the panel.</p>
          
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
            />
          </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '14px', marginBottom: '24px', justifyContent: 'center' }}>
              <AlertTriangle size={16} /> {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={authLoading}
            style={{ width: '100%', padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {authLoading ? <Loader2 size={20} className="spinner" /> : 'Login'}
          </button>
          
          <a href="/" style={{ display: 'block', marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>
            &larr; Back to Market
          </a>
        </div>
      </div>
    )
  }

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        width: '100%', textAlign: 'left', background: activeTab === id ? 'var(--bg-elevated)' : 'transparent',
        border: 'none', borderRadius: '8px', color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
        fontWeight: activeTab === id ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <Icon size={18} /> {label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toast.type === 'success' ? 'var(--success)' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: '280px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#ef4444" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700 }}>Admin Panel</h1>
              <a href="/" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; Back to Website</a>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <TabButton id="overview" icon={BarChart3} label="Overview" />
          <TabButton id="users" icon={Users} label="Users" />
          <TabButton id="deposits" icon={Wallet} label="Deposits" />
          <TabButton id="purchases" icon={ShoppingBag} label="Purchases" />
          <TabButton id="settings" icon={SettingsIcon} label="Settings" />
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => { setIsAuthed(false); setPassword('') }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Dashboard Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} /> Total Users
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats?.totalUsers || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={16} /> Total Revenue (INR)
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>₹{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} /> Total Purchases
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats?.totalPurchases || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} /> Today's Sales
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>{stats?.todayPurchases || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>User Management</h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>User</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Balance</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Purchases</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{u.username || `User #${u.id}`}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--accent)', fontWeight: 600 }}>₹{u.balance.toFixed(2)}</td>
                      <td style={{ padding: '16px 24px' }}>{u._count.purchases}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Deposit Requests</h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>User</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Amount</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Reference / UTR</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{d.user?.username || 'Unknown'}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>₹{d.amount.toFixed(2)}</td>
                      <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.reference}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                          background: d.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : d.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: d.status === 'APPROVED' ? '#22c55e' : d.status === 'REJECTED' ? '#ef4444' : '#eab308'
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {d.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleDepositAction(d.id, 'approve')} style={{ padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => handleDepositAction(d.id, 'reject')} style={{ padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No deposit requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PURCHASES */}
        {activeTab === 'purchases' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>All Purchases</h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>User</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Item ID</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Country</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Price (INR)</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{p.user?.username || 'Unknown'}</td>
                      <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.lztItemId}</td>
                      <td style={{ padding: '16px 24px' }}>{p.countryName || '-'}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>₹{p.priceInr.toFixed(2)}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No purchases yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Platform Settings</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Key size={18} /> API Configuration</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>LZT API Token</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showToken ? 'text' : 'password'}
                        placeholder={settings?.lztApiToken || 'Enter new token'}
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        style={{ width: '100%', padding: '12px 40px 12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <button onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {settings?.hasToken && !newToken && (
                    <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Active token is set
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={18} /> Financial Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Profit Margin (%)</label>
                    <input
                      type="number"
                      value={newProfit}
                      onChange={(e) => setNewProfit(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>USD to INR Rate</label>
                    <input
                      type="number"
                      value={newExchangeRate}
                      onChange={(e) => setNewExchangeRate(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><QrCode size={18} /> Payment & Contact</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Deposit UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@upi"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Support URL (e.g. Telegram link)</label>
                    <input
                      type="text"
                      placeholder="https://t.me/your_bot"
                      value={newAdminChatId}
                      onChange={(e) => setNewAdminChatId(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}
              >
                {saving ? <Loader2 size={20} className="spinner" /> : <><Save size={20} /> Save All Changes</>}
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
