'use client'

import { useEffect, useState } from 'react'
import { TelegramAccount } from '@/lib/lzt'
import { getCountryName, getCountryFlagUrl } from '@/lib/countries'
import { X, ExternalLink, ShoppingCart } from 'lucide-react'

import { useTma } from './TmaProvider'

interface Props {
  account: TelegramAccount
  onClose: () => void
  inrExchangeRate: number
}

function formatPrice(price: number, inrExchangeRate: number): string {
  const usd = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inr = (price * inrExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `$ ${usd} USD | ₹ ${inr} INR`
}

function formatDate(ts: number | null): string {
  if (!ts) return 'Unknown'
  return new Date(ts * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return 'Unknown'
  const diffInSeconds = Math.floor(Date.now() / 1000 - ts)
  
  if (diffInSeconds < 60) return 'Just now'
  
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo ago`
  
  const years = Math.floor(days / 365)
  return `${years} yr${years > 1 ? 's' : ''} ago`
}

function isSpammed(v: number | string | null): boolean {
  if (v === null || v === undefined) return false
  return Number(v) !== -1
}

function YesNo({ value, danger = false }: { value: boolean; danger?: boolean }) {
  if (value) {
    return (
      <span style={{
        fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px',
        color: danger ? 'var(--danger)' : 'var(--success)'
      }}>
        Yes
      </span>
    )
  }
  return (
    <span style={{
      fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px',
      color: 'var(--text-muted)'
    }}>
      No
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '20px', marginBottom: '20px',
    }}>
      <h3 style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function AccountModal({ account, onClose, inrExchangeRate }: Props) {
  const { user } = useTma()

  const countryName = getCountryName(account.telegram_country)
  const flagUrl = getCountryFlagUrl(account.telegram_country)
  const isPremium = account.telegram_premium === 1
  const hasPassword = account.telegram_password === 1
  const hasEmail = (account as any).telegram_email === 1
  const spam = isSpammed(account.telegram_spam_block)
  const origin = (account as any).item_origin as string | undefined
  const originLabel = origin ? origin.replace('_', ' ') : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,20,25,0.85)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="fade-in" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {flagUrl ? (
              <img src={flagUrl} alt={countryName} style={{ width: '24px', borderRadius: '2px' }} loading="lazy" />
            ) : (
              <div style={{ width: '24px', height: '18px', background: 'var(--bg-elevated)', borderRadius: '2px' }} />
            )}
            <div>
              <h2 style={{ fontWeight: 600, fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {countryName}
              </h2>
              {originLabel && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                  Origin: {originLabel}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '4px', padding: '8px', cursor: 'pointer',
            color: 'var(--text-secondary)', display: 'flex', transition: 'all 200ms ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>

          {/* Account Status */}
          <SectionBox title="Account Status">
            <Row label="Telegram Premium">
              <YesNo value={isPremium} />
            </Row>
            <Row label="2FA / Cloud Password">
              <YesNo value={hasPassword} />
            </Row>
            <Row label="Login Email">
              <YesNo value={hasEmail} />
            </Row>
            <Row label="Spam Block">
              <YesNo value={spam} danger={true} />
            </Row>
            {isPremium && account.telegram_premium_expires ? (
              <Row label="Premium Expires">{formatDate(account.telegram_premium_expires)}</Row>
            ) : null}
          </SectionBox>

          {/* Statistics */}
          <SectionBox title="Statistics">
            <Row label="Last Seen">{formatRelativeTime(account.telegram_last_seen)}</Row>
            {account.telegram_id_count != null && <Row label="ID Digits">{account.telegram_id_count}</Row>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Channels</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{(account.telegram_channels_count ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contacts</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{(account.telegram_contacts_count ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chats</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{(account.telegram_chats_count ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Conversations</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{(account.telegram_conversations_count ?? 0).toLocaleString()}</div>
              </div>
            </div>

            {((account.telegram_stars_count ?? 0) > 0 || ((account as any).telegram_gifts_count ?? 0) > 0 || (account.telegram_admin_count ?? 0) > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {(account.telegram_stars_count ?? 0) > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stars</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#d4af37', marginTop: '4px' }}>{account.telegram_stars_count!.toLocaleString()}</div>
                  </div>
                )}
                {((account as any).telegram_gifts_count ?? 0) > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gifts</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#8b5cf6', marginTop: '4px' }}>{((account as any).telegram_gifts_count).toLocaleString()}</div>
                  </div>
                )}
                {(account.telegram_admin_count ?? 0) > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Admin Channels</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{account.telegram_admin_count!.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </SectionBox>

          {/* Seller */}
          {account.seller && (
            <SectionBox title="Seller Information">
              <Row label="Username">
                <span style={{ color: 'var(--text-primary)' }}>@{account.seller.username || 'Unknown'}</span>
              </Row>
              <Row label="Total Sold">{account.seller.sold_items_count?.toLocaleString() ?? '—'}</Row>
              <Row label="Active Listings">{account.seller.active_items_count?.toLocaleString() ?? '—'}</Row>
            </SectionBox>
          )}

          {/* Buy Action Box */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px', textAlign: 'center', marginTop: '12px'
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Price</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', marginBottom: '16px' }}>
              {formatPrice(account.price, inrExchangeRate)}
            </p>
            {user && (
              <button
                onClick={() => window.open(`/account/${account.item_id}`, '_blank')}
                style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ShoppingCart size={18} />
                Buy Now
              </button>
            )}

            {!user && (
              <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '12px', textAlign: 'center' }}>
                Please login to purchase this account.
              </p>
            )}
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
