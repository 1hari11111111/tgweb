'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TelegramAccount } from '@/lib/lzt'
import { getCountryName, getCountryFlagUrl } from '@/lib/countries'
import { useAuth } from '@/components/TmaProvider'
import { ArrowLeft, Loader2, ShoppingCart, Download, AlertCircle, CheckCircle, Copy, Check, Key, RotateCcw, Smartphone } from 'lucide-react'

function formatPrice(price: number, inrExchangeRate: number): string {
  const usd = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inr = (price * inrExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `$ ${usd} USD | ₹ ${inr} INR`
}

function formatDate(ts: number | null): string {
  if (!ts) return 'Unknown'
  return new Date(ts * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function YesNo({ value, danger = false }: { value: boolean; danger?: boolean }) {
  if (value) return <span style={{ fontSize: '12px', fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--success)' }}>Yes</span>
  return <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>No</span>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
        <span style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</span>
        <button
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
          title="Copy"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}

interface LoginData {
  phoneNumber: string | null
  authKey: string | null
  dcId: string | number | null
  userId: string | number | null
}

export default function AccountCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const [account, setAccount] = useState<TelegramAccount | null>(null)
  const [inrRate, setInrRate] = useState(84)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [purchasing, setPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [loginData, setLoginData] = useState<LoginData | null>(null)
  const [purchasedItemId, setPurchasedItemId] = useState<number | null>(null)

  // Login code state
  const [loginCode, setLoginCode] = useState<string | null>(null)
  const [loginCodeLoading, setLoginCodeLoading] = useState(false)
  const [loginCodeError, setLoginCodeError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch(`/api/account/${params.id}`)
        const data = await res.json()
        if (res.ok) {
          setAccount(data.item)
          setInrRate(data.inrExchangeRate)
        } else {
          setError(data.error || 'Failed to load account')
        }
      } catch (err) {
        setError('Network error loading account')
      } finally {
        setLoading(false)
      }
    }
    fetchAccount()
  }, [params.id])

  const handlePurchase = async () => {
    if (!user) return
    setPurchasing(true)
    setPurchaseError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: account?.item_id })
      })
      const data = await res.json()

      if (res.ok) {
        setPurchaseSuccess(true)
        setLoginData(data.loginData || null)
        setPurchasedItemId(data.itemId || account?.item_id || null)
        refreshUser()
      } else {
        setPurchaseError(data.error || 'Purchase failed')
      }
    } catch (err) {
      setPurchaseError('Network error during purchase')
    } finally {
      setPurchasing(false)
    }
  }

  const handleGetLoginCode = async () => {
    if (!purchasedItemId) return
    setLoginCodeLoading(true)
    setLoginCodeError(null)
    setLoginCode(null)
    try {
      const res = await fetch(`/api/account/${purchasedItemId}/login-code`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setLoginCode(data.loginCode || data.code || JSON.stringify(data))
      } else {
        setLoginCodeError(data.error || 'Failed to get login code')
      }
    } catch (err) {
      setLoginCodeError('Network error')
    } finally {
      setLoginCodeLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={32} className="spinner" color="var(--accent)" />
      </div>
    )
  }

  if (error || !account) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Error</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '24px', padding: '10px 20px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          Back to Market
        </button>
      </div>
    )
  }

  const costInr = account.price * inrRate
  const countryName = getCountryName(account.telegram_country)
  const flagUrl = getCountryFlagUrl(account.telegram_country)
  const itemId = purchasedItemId || account.item_id

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    border: 'none', cursor: 'pointer', transition: 'transform 0.1s, opacity 0.2s',
    textDecoration: 'none',
  } as React.CSSProperties

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>
            {purchaseSuccess ? '✅ Purchase Complete' : `Checkout Account #${account.item_id}`}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

        {/* Account Details */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {flagUrl && <img src={flagUrl} alt={countryName} width={32} height={24} style={{ borderRadius: '4px' }} />}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{countryName}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID: {account.item_id}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Row label="Price">{formatPrice(account.price, inrRate)}</Row>
            <Row label="Premium"><YesNo value={account.telegram_premium === 1} /></Row>
            <Row label="Spam Block"><YesNo value={account.telegram_spam_block !== null && Number(account.telegram_spam_block) !== -1} danger /></Row>
            <Row label="2FA Password"><YesNo value={account.telegram_password === 1} /></Row>
            <Row label="Last Seen">{formatDate(account.telegram_last_seen)}</Row>
            <Row label="Contacts">{account.telegram_contacts_count ?? 0}</Row>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Groups & Channels</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Channels</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{account.telegram_channels_count ?? account.telegram_group_counters?.channels ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Chats</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{account.telegram_chats_count ?? account.telegram_group_counters?.chats ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Admin Rights</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{account.telegram_admin_count ?? account.telegram_group_counters?.admin ?? 0}</div>
            </div>
          </div>
        </div>

        {/* ─── POST-PURCHASE: Success + Login Data + Downloads ─── */}
        {purchaseSuccess ? (
          <>
            {/* Success Banner */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle size={28} color="#22c55e" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>Purchase Successful!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>The account has been purchased. Use the options below to access it.</p>
            </div>

            {/* Telegram Login Data */}
            {loginData && (loginData.phoneNumber || loginData.authKey || loginData.dcId || loginData.userId) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Smartphone size={20} color="var(--accent)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Telegram Login Data</h3>
                </div>
                {loginData.phoneNumber && <CopyField label="Phone Number" value={String(loginData.phoneNumber)} />}
                {loginData.authKey && <CopyField label="Auth Key (HEX)" value={String(loginData.authKey)} />}
                {loginData.dcId && <CopyField label="DC ID" value={String(loginData.dcId)} />}
                {loginData.userId && <CopyField label="User ID" value={String(loginData.userId)} />}
              </div>
            )}

            {/* Download Options */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Download size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Download As</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { type: 'tdata', label: 'TData' },
                  { type: 'session_telethon', label: '.session Telethon' },
                  { type: 'session_pyrogram', label: '.session Pyrogram' },
                  { type: 'json', label: '.json' },
                ].map(d => (
                  <a
                    key={d.type}
                    href={`/api/account/${itemId}/download?type=${d.type}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...btnStyle, background: 'var(--accent)', color: 'white' }}
                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Download size={14} /> {d.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Get Telegram Login Code */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Key size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Get Telegram Login Code</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={handleGetLoginCode}
                  disabled={loginCodeLoading}
                  style={{ ...btnStyle, background: 'var(--accent)', color: 'white', opacity: loginCodeLoading ? 0.7 : 1 }}
                >
                  {loginCodeLoading ? <Loader2 size={14} className="spinner" /> : <Key size={14} />}
                  {loginCodeLoading ? 'Requesting...' : 'Get a Code'}
                </button>
              </div>

              {loginCode && (
                <div style={{ marginTop: '16px' }}>
                  <CopyField label="Login Code" value={loginCode} />
                </div>
              )}
              {loginCodeError && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                  {loginCodeError}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ─── PRE-PURCHASE: Confirm Purchase ─── */
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Confirm Purchase</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Price</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{formatPrice(account.price, inrRate)}</span>
            </div>

            {purchaseError && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Purchase Failed</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>{purchaseError}</div>
                </div>
              </div>
            )}

            {!user ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Please login to purchase this account.</p>
              </div>
            ) : user.balance < costInr ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                <p style={{ color: '#ef4444', fontWeight: 500, marginBottom: '4px' }}>Insufficient Balance</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your balance is ₹{user.balance.toFixed(2)}. Please top up your wallet.</p>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', opacity: purchasing ? 0.7 : 1, transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {purchasing ? <Loader2 size={20} className="spinner" /> : <ShoppingCart size={20} />}
                {purchasing ? 'Processing...' : 'Confirm Purchase'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
