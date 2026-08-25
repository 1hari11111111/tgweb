'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/TmaProvider'
import { ArrowLeft, Loader2, User, Wallet, ShoppingBag, Download, Key, Smartphone, ChevronRight } from 'lucide-react'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' }}>
        <span style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</span>
        <button
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--accent)', cursor: 'pointer', padding: '4px', flexShrink: 0, fontSize: '12px', fontWeight: 600 }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  
  const [stats, setStats] = useState<any>(null)
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null)

  useEffect(() => {
    if (user === null) {
      router.push('/')
      return
    }

    async function fetchData() {
      try {
        const [statsRes, purchasesRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/purchases')
        ])
        
        if (statsRes.ok) setStats(await statsRes.json())
        if (purchasesRes.ok) {
          const pData = await purchasesRes.json()
          setPurchases(pData.purchases || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="spinner" color="var(--accent)" />
      </div>
    )
  }

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
    background: 'var(--accent)', color: 'white'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>My Profile</h1>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px', display: 'grid', gap: '24px' }}>
        {/* User Stats Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{stats?.username || 'User'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Member since {stats?.createdAt ? formatDate(stats.createdAt) : 'Unknown'}</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Wallet size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Balance</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>₹{stats?.balance?.toFixed(2) || '0.00'}</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Download size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Total Deposited</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>₹{stats?.totalDeposited?.toFixed(2) || '0.00'}</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <ShoppingBag size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Total Spent</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>₹{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Purchase History ({stats?.totalPurchases || 0})</h3>
          </div>
          
          {purchases.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'inline-block' }} />
              <p>You haven't purchased any accounts yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {purchases.map(p => (
                <div key={p.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setSelectedPurchase(selectedPurchase?.id === p.id ? null : p)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{p.countryName || 'Unknown Country'}</span>
                        <span style={{ fontSize: '12px', padding: '2px 8px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)' }}>ID: {p.lztItemId}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{p.priceInr.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>${p.priceUsd.toFixed(2)}</div>
                      </div>
                      <ChevronRight size={20} color="var(--text-muted)" style={{ transform: selectedPurchase?.id === p.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {selectedPurchase?.id === p.id && (
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Smartphone size={16} color="var(--accent)" />
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Login Data</h4>
                        </div>
                        {p.phoneNumber && <CopyField label="Phone Number" value={p.phoneNumber} />}
                        {p.authKey && <CopyField label="Auth Key (HEX)" value={p.authKey} />}
                        {p.dcId && <CopyField label="DC ID" value={p.dcId} />}
                        {p.tgUserId && <CopyField label="User ID" value={p.tgUserId} />}
                        {!p.phoneNumber && !p.authKey && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No login data saved for this account.</div>}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Download size={16} color="var(--accent)" />
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Downloads</h4>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {[
                            { type: 'tdata', label: 'TData' },
                            { type: 'session_telethon', label: '.session Telethon' },
                            { type: 'session_pyrogram', label: '.session Pyrogram' },
                            { type: 'json', label: '.json' },
                          ].map(d => (
                            <a
                              key={d.type}
                              href={`/api/account/${p.lztItemId}/download?type=${d.type}`}
                              target="_blank"
                              rel="noreferrer"
                              style={btnStyle}
                            >
                              {d.label}
                            </a>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
