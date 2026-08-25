'use client'

import { useState } from 'react'
import { useAuth } from './TmaProvider'
import { X, User, Lock, Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    const res = await login(username.trim(), password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      onClose()
    }
  }

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) { setError('Please fill all fields'); return }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const json = await res.json()
      if (res.ok) {
        // Auto login after register
        const loginRes = await login(username.trim(), password)
        if (!loginRes.error) { onClose(); return }
      }
      setError(json.error || 'Registration failed')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease-out' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 16px rgba(17, 94, 59, 0.4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 5L2 12.5L9 13.5M21 5L18.5 20L9 13.5M21 5L9 13.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>TGAccounts</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Sign in to access your wallet</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.2s', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <User size={12} /> Username
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="Enter username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())}
              style={{ height: '42px', width: '100%', padding: '0 12px', borderRadius: '10px' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Lock size={12} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-base"
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())}
                style={{ height: '42px', width: '100%', padding: '0 40px 0 12px', borderRadius: '10px' }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            style={{ height: '46px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(17, 94, 59, 0.35)', transition: 'transform 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? (
              <Loader2 size={18} className="spinner" />
            ) : tab === 'login' ? (
              <><LogIn size={18} /> Login</>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
