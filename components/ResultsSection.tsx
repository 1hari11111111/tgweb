'use client'

import { useState, useEffect } from 'react'
import { TelegramAccount } from '@/lib/lzt'
import { getCountryName, getCountryFlagUrl } from '@/lib/countries'
import AccountModal from './AccountModal'
import {
  AlertTriangle, RefreshCw, SearchX, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react'

interface SearchResult {
  items: TelegramAccount[]
  totalItems: number
  hasNextPage: boolean
  perPage: number
  page: number
}

interface Props {
  results: SearchResult | null
  loading: boolean
  error: string | null
  hasFetched: boolean
  currentPage: number
  sortBy: string
  onPageChange: (page: number) => void
  onSortChange: (sort: string) => void
  onRetry: () => void
  onReset: () => void
}

const SORT_OPTIONS = [
  { value: 'pdate_to_down', label: 'Newest first ↓' },
  { value: 'pdate_to_up', label: 'Oldest first ↑' },
  { value: 'price_to_up', label: 'Price Low-High' },
  { value: 'price_to_down', label: 'Price High-Low' },
]

function formatPrice(price: number, inrExchangeRate: number) {
  const usd = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inr = (price * inrExchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `$ ${usd} USD | ₹ ${inr} INR`
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

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '6px 12px', borderRadius: '3px',
      background: 'transparent', color: color,
      border: '1px solid rgba(255,255,255,0.15)',
      fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '100px', height: '16px' }} />
        <div className="skeleton" style={{ width: '80px', height: '16px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[60, 70, 65].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: '24px', borderRadius: '3px' }} />)}
      </div>
      <div className="skeleton" style={{ width: '100%', height: '16px', marginTop: '8px' }} />
      <div className="skeleton" style={{ height: '40px', borderRadius: '4px', marginTop: '16px' }} />
    </div>
  )
}

function AccountCard({ account, onClick, inrExchangeRate }: { account: TelegramAccount; onClick: () => void; inrExchangeRate: number }) {
  const countryName = getCountryName(account.telegram_country)
  const flagUrl = getCountryFlagUrl(account.telegram_country)
  
  const isPremium = account.telegram_premium === 1
  const hasPassword = account.telegram_password === 1
  const hasEmail = (account as any).telegram_email === 1
  const spam = isSpammed(account.telegram_spam_block)
  const origin = (account as any).item_origin as string | undefined
  const originLabel = origin ? origin.replace('_', ' ').toUpperCase() : null

  const ch = account.telegram_channels_count ?? 0
  const chats = account.telegram_chats_count ?? 0
  const contacts = account.telegram_contacts_count ?? 0
  const conv = account.telegram_conversations_count ?? 0

  return (
    <div
      onClick={onClick}
      style={{ 
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Header: Country + Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {flagUrl ? (
            <img src={flagUrl} alt={countryName} style={{ width: '16px', borderRadius: '2px' }} loading="lazy" />
          ) : (
            <div style={{ width: '16px', height: '12px', background: 'var(--bg-elevated)', borderRadius: '2px' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {countryName}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {formatRelativeTime(account.telegram_last_seen)}
            </span>
          </div>
        </div>
        
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', textAlign: 'right' }}>
          {formatPrice(account.price, inrExchangeRate)}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        {originLabel && <Badge color="var(--text-secondary)">{originLabel}</Badge>}
        {spam ? <Badge color="var(--danger)">SPAM</Badge> : <Badge color="var(--success)">NO SPAM</Badge>}
        {isPremium && <Badge color="#d4af37">PREMIUM</Badge>}
        {hasPassword && <Badge color="#8b5cf6">2FA</Badge>}
        {hasEmail && <Badge color="var(--info)">EMAIL</Badge>}
      </div>

      {/* Stats - 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', flex: 1 }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Channels </span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{ch.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contacts </span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{contacts.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chats </span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{chats.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Conv. </span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{conv.toLocaleString()}</span>
        </div>
      </div>

      {/* Buy Action */}
      <button
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{ 
          width: '100%', height: '40px', marginTop: '16px', 
          background: 'var(--accent)', color: '#fff', 
          fontSize: '14px', fontWeight: 600, textTransform: 'uppercase',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          transition: 'all 200ms ease-out'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Purchase Account
      </button>
    </div>
  )
}

function Pagination({ currentPage, totalItems, perPage, hasNextPage, onPageChange }: {
  currentPage: number; totalItems: number; perPage: number
  hasNextPage: boolean; onPageChange: (p: number) => void
}) {
  const totalPages = Math.min(Math.ceil(totalItems / perPage), 50)
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  const delta = 2
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '32px' }}>
      <button className="page-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ChevronLeft size={14} /> Prev
      </button>
      {pages.map((page, i) => (
        page === '...' ? (
          <span key={`d${i}`} style={{ color: 'var(--text-muted)', padding: '0 8px', fontSize: '13px' }}>…</span>
        ) : (
          <button key={page} className={`page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page as number)}>
            {page}
          </button>
        )
      ))}
      <button className="page-btn" disabled={!hasNextPage && currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        Next <ChevronRight size={14} />
      </button>
    </div>
  )
}

export default function ResultsSection({
  results, loading, error, hasFetched, currentPage, sortBy,
  onPageChange, onSortChange, onRetry, onReset
}: Props) {
  const [selectedAccount, setSelectedAccount] = useState<TelegramAccount | null>(null)

  if (loading && !results) return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div className="spinner" />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading accounts...</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )

  if (error) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} className="fade-in">
      <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={24} color="var(--danger)" />
      </div>
      <div>
        <p style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>Failed to fetch accounts</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
      </div>
      <button onClick={onRetry} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', height: '40px', padding: '0 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  )

  if (!hasFetched && !results) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '400px', gap: '16px', color: 'var(--text-muted)',
    }}>
      <SearchX size={32} color="var(--text-faint)" />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>No results yet</p>
        <p style={{ fontSize: '14px' }}>Adjust your filters and run a search.</p>
      </div>
    </div>
  )

  if (results && results.items.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} className="fade-in">
      <SearchX size={32} color="var(--text-faint)" />
      <div>
        <p style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>No accounts found</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Try adjusting your filters.</p>
      </div>
      <button onClick={onReset} className="page-btn" style={{ padding: '8px 24px', marginTop: '8px' }}>
        Reset Filters
      </button>
    </div>
  )

  if (!results) return null

  return (
    <div className="fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {results.totalItems.toLocaleString()} accounts found
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
              <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}/>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>Updating...</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select className="input-base" style={{ width: 'auto', minWidth: '180px', fontSize: '14px', padding: '8px 28px 8px 12px', background: 'var(--bg-card)' }}
              value={sortBy} onChange={e => onSortChange(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px', 
        opacity: loading ? 0.6 : 1, 
        transition: 'opacity 200ms ease' 
      }}>
        {results.items.map(account => (
          <AccountCard key={account.item_id} account={account} onClick={() => setSelectedAccount(account)} inrExchangeRate={results.inrExchangeRate} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalItems={results.totalItems} perPage={results.perPage} hasNextPage={results.hasNextPage} onPageChange={onPageChange} />

      {selectedAccount && <AccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} inrExchangeRate={results.inrExchangeRate} />}
    </div>
  )
}
