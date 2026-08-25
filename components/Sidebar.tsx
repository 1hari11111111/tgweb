import { useState, useEffect } from 'react'
import { User, ShieldAlert, LogIn, LogOut, MessageCircle, Megaphone, X, ShoppingBag, Download, Smartphone, ChevronRight } from 'lucide-react'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px' }}>
      <span style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
      <button
        onClick={handleCopy}
        style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--accent)', cursor: 'pointer', padding: '0', flexShrink: 0, fontSize: '11px', fontWeight: 600 }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function Sidebar({ user, onClose, onLogin, onLogout, settings }: any) {
  const [purchases, setPurchases] = useState<any[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetch('/api/profile/purchases?limit=10')
      .then(res => res.json())
      .then(data => setPurchases(data.purchases || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      
      <div style={{ position: 'relative', width: '320px', height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'slideLeft 0.2s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user ? 'var(--accent)' : 'var(--text-muted)' }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{user?.username || 'Guest'}</div>
              {user ? (
                <div style={{ fontSize: '12px', color: 'var(--accent)' }}>₹ {user.balance.toFixed(2)} balance</div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not logged in</div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Support Links */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <a href={settings?.adminChatId || '#'} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
            <MessageCircle size={18} color="var(--accent)" /> Support Chat
          </a>
          {/* If you add main channel link in settings, you can use it here */}
          <a href={settings?.mainChannelId || '#'} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
            <Megaphone size={18} color="#eab308" /> Main Channel
          </a>
        </div>

        {/* My Orders (Only if logged in) */}
        {user && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={16} /> My Orders
            </h3>
            
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading orders...</div>
            ) : purchases.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No purchases yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {purchases.map(p => (
                  <div key={p.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => setSelectedPurchase(selectedPurchase?.id === p.id ? null : p)}
                      style={{ padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.countryName || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)} • ID: {p.lztItemId}</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ transform: selectedPurchase?.id === p.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {selectedPurchase?.id === p.id && (
                      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Login Data</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {p.phoneNumber ? <CopyField value={`Phone: ${p.phoneNumber}`} /> : null}
                            {p.authKey ? <CopyField value={`Key: ${p.authKey.substring(0, 10)}...`} /> : null}
                            {!p.phoneNumber && !p.authKey && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No data saved.</div>}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <a href={`/api/account/${p.lztItemId}/download?type=tdata`} target="_blank" style={{ padding: '6px', background: 'var(--accent)', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>TData</a>
                          <a href={`/api/account/${p.lztItemId}/download?type=session_telethon`} target="_blank" style={{ padding: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Telethon</a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', textDecoration: 'none', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
                  <ShieldAlert size={18} /> Admin Panel
                </a>
              )}
              <button
                onClick={async () => { await onLogout(); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%' }}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { onClose(); onLogin() }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            >
              <LogIn size={18} /> Login / Register
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
