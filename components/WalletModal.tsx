'use client'

import { useState } from 'react'
import { useTma } from './TmaProvider'
import { X, Wallet, ArrowRight, Loader2, IndianRupee, QrCode, CheckCircle, Copy } from 'lucide-react'

export default function WalletModal({ onClose }: { onClose: () => void }) {
  const { user, initData, upiId, refreshUser } = useTma()
  const [tab, setTab] = useState<'balance' | 'deposit'>('balance')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleDeposit = async () => {
    if (!amount || !reference) return
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          amount,
          reference
        })
      })
      if (res.ok) {
        setSuccess(true)
        await refreshUser()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit deposit')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const upiLink = upiId ? `upi://pay?pa=${upiId}&pn=TGAccounts&am=${amount || '0'}&cu=INR` : ''
  const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}` : ''

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ position: 'relative', background: 'var(--bg-card)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', padding: '32px 24px', animation: 'slideUp 0.3s ease-out', borderTop: '1px solid var(--border)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>

        {tab === 'balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(17, 94, 59, 0.2)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={32} color="var(--accent)" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Available Balance</p>
              <h2 style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                ₹ {user?.balance?.toFixed(2) || '0.00'}
              </h2>
            </div>

            <button
              onClick={() => setTab('deposit')}
              style={{ width: '100%', height: '48px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <ArrowRight size={18} /> Deposit INR
            </button>
          </div>
        )}

        {tab === 'deposit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={20} color="var(--accent)" /> Deposit INR
            </h2>

            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <CheckCircle size={48} color="var(--success)" />
                <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Request Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                  Your deposit is pending approval by the admin. The balance will be added to your wallet shortly.
                </p>
                <button
                  onClick={onClose}
                  style={{ marginTop: '16px', height: '44px', padding: '0 24px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {amount && Number(amount) > 0 ? (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
                    {qrUrl && upiId ? (
                      <img src={qrUrl} alt="UPI QR" width={150} height={150} style={{ borderRadius: '8px', background: 'white', padding: '8px' }} />
                    ) : (
                      <QrCode size={120} color="var(--text-muted)" />
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Scan to Pay or Use UPI ID</p>
                      {upiId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{upiId}</span>
                          <button onClick={() => navigator.clipboard.writeText(upiId)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}><Copy size={14} /></button>
                        </div>
                      ) : (
                        <p style={{ fontSize: '14px', color: 'var(--danger)', marginTop: '8px' }}>UPI ID not configured by Admin</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '50%', marginBottom: '8px' }}>
                      <QrCode size={32} color="var(--text-muted)" />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Enter the amount you wish to deposit below to generate your personalized payment QR code.</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Amount Paid (INR)</label>
                    <input
                      type="number"
                      className="input-base"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      style={{ height: '44px', width: '100%', padding: '0 16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Transaction ID / UTR</label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Enter 12-digit UTR"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      style={{ height: '44px', width: '100%', padding: '0 16px' }}
                    />
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={loading || !amount || !reference}
                    style={{ height: '48px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', opacity: (loading || !amount || !reference) ? 0.7 : 1, marginTop: '8px' }}
                  >
                    {loading ? <Loader2 size={18} className="spinner" /> : 'Submit Proof'}
                  </button>
                  <button
                    onClick={() => setTab('balance')}
                    style={{ height: '48px', background: 'transparent', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
