'use client'

import { useState } from 'react'
import {
  Shield, Key, Percent, Save, Eye, EyeOff,
  CheckCircle, AlertTriangle, Lock, ArrowLeft, Loader2, DollarSign, Wallet, QrCode
} from 'lucide-react'

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

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [newToken, setNewToken] = useState('')
  const [newProfit, setNewProfit] = useState('')
  const [newExchangeRate, setNewExchangeRate] = useState('')
  const [newUpiId, setNewUpiId] = useState('')
  const [newAdminChatId, setNewAdminChatId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [deposits, setDeposits] = useState<Deposit[]>([])

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
      fetchDeposits()
    } catch {
      setAuthError('Connection error. Try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSave = async () => {
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
      const data = await res.json()

      if (!res.ok) {
        showToast('error', data.error || 'Failed to save settings')
        return
      }

      setSettings(data)
      setNewToken('')
      setNewProfit(String(data.profitPercent))
      setNewExchangeRate(String(data.inrExchangeRate))
      setNewUpiId(data.upiId || '')
      setNewAdminChatId(data.adminChatId || '')
      showToast('success', 'Settings saved successfully')
    } catch {
      showToast('error', 'Connection error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const calcExample = () => {
    const base = 10
    const profitPct = parseFloat(newProfit) || 0
    const rate = parseFloat(newExchangeRate) || 84
    
    const profitUsd = base * (profitPct / 100)
    const totalUsd = base + profitUsd
    const profitInr = profitUsd * rate

    return `If base price is $10.00: + ${profitPct}% profit = $${totalUsd.toFixed(2)}. Profit = $${profitUsd.toFixed(2)} (₹${profitInr.toFixed(2)} INR)`
  }

  const fetchDeposits = async () => {
    const res = await fetch('/api/admin/deposits', { headers: { 'x-admin-password': password } })
    if (res.ok) setDeposits(await res.json())
  }

  const handleDepositAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const res = await fetch('/api/admin/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, transactionId: id, action })
    })
    if (res.ok) {
      showToast('success', `Deposit ${action.toLowerCase()}d!`)
      fetchDeposits()
    } else {
      showToast('error', 'Action failed')
    }
  }

  // Login Screen
  if (!isAuthed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to store
          </a>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Shield size={24} color="var(--accent)" />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Admin Panel</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your password to access settings</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  <Lock size={14} /> Password
                </label>
                <input
                  type="password"
                  className="input-base"
                  style={{ height: '44px', padding: '0 16px', fontSize: '16px' }}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setAuthError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
              </div>

              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '14px', background: 'rgba(220,38,38,0.1)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <AlertTriangle size={16} /> {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={authLoading}
                style={{
                  height: '44px', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 200ms ease'
                }}
              >
                {authLoading ? <Loader2 size={18} className="spinner" /> : <Shield size={18} />}
                {authLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 24px' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000, background: 'var(--bg-elevated)', border: `1px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, borderRadius: '4px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 200ms ease' }}>
          {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertTriangle size={20} color="var(--danger)" />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to store
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="var(--accent)" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Admin Settings</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your LZT Market configuration</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* API Token Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={16} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>LZT API Token</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Authentication token for LZT Market API</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Token</span>
                <span style={{ fontWeight: 600, color: settings?.hasToken ? 'var(--success)' : 'var(--danger)' }}>{settings?.hasToken ? '● Active' : '● Not Set'}</span>
              </div>
              {settings?.hasToken && <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{settings.lztApiToken}</div>}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Key size={14} /> New Token
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  className="input-base"
                  style={{ height: '40px', padding: '0 40px 0 16px', width: '100%', fontSize: '14px' }}
                  placeholder="Paste new API token..."
                  value={newToken}
                  onChange={e => setNewToken(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Leave empty to keep current token</p>
            </div>
          </div>

          {/* Pricing & Profit Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Percent size={16} color="#22c55e" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Pricing & Profit</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure profit markup and currency exchange</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} color="var(--accent)" /> Base Currency to INR Rate
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="input-base"
                    placeholder="e.g. 84.50"
                    value={newExchangeRate}
                    onChange={e => setNewExchangeRate(e.target.value)}
                    style={{ width: '100%', paddingLeft: '32px' }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>₹</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={14} color="var(--accent)" /> Wallet UPI ID
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="e.g. yourname@upi"
                  value={newUpiId}
                  onChange={e => setNewUpiId(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Percent size={14} /> Profit Margin (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="input-base"
                  style={{ height: '40px', padding: '0 40px 0 16px', width: '100%', fontSize: '14px' }}
                  placeholder="e.g. 10"
                  min={0} max={1000} step={0.1}
                  value={newProfit}
                  onChange={e => setNewProfit(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '16px', top: '10px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Shield size={14} /> Admin Telegram Chat ID (For Notifications)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-base"
                  style={{ height: '40px', padding: '0 16px', width: '100%', fontSize: '14px' }}
                  placeholder="e.g. 123456789"
                  value={newAdminChatId}
                  onChange={e => setNewAdminChatId(e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '12px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--info)' }}><AlertTriangle size={18} /></div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Pricing Example:</strong>
                {calcExample()}
              </div>
            </div>

          </div>

          {/* Deposits Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={16} color="#eab308" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Pending Deposits</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approve or reject user wallet deposits</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deposits.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No pending deposits.</p>
              ) : (
                deposits.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{d.amount} {d.currency}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>User: {d.user?.username || d.userId} • UTR: {d.reference}</p>
                      <span style={{ fontSize: '11px', padding: '2px 6px', background: d.status === 'PENDING' ? 'rgba(234,179,8,0.2)' : (d.status === 'APPROVED' ? 'rgba(34,197,94,0.2)' : 'rgba(220,38,38,0.2)'), color: d.status === 'PENDING' ? '#eab308' : (d.status === 'APPROVED' ? '#22c55e' : '#dc2626'), borderRadius: '4px', display: 'inline-block', marginTop: '6px' }}>{d.status}</span>
                    </div>
                    {d.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDepositAction(d.id, 'APPROVE')} style={{ padding: '6px 12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Approve</button>
                        <button onClick={() => handleDepositAction(d.id, 'REJECT')} style={{ padding: '6px 12px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: '48px', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase',
            border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 200ms ease'
          }}
        >
          {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

      </div>
    </div>
  )
}
