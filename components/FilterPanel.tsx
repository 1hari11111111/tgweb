'use client'

import { useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'

export interface FilterValues {
  pmin?: number | string
  pmax?: number | string
  origin?: string
  country?: string[]
  premium?: 'yes' | 'no' | 'nomatter'
  password?: 'yes' | 'no' | 'nomatter'
  spam?: 'yes' | 'no' | 'nomatter'
  email?: 'yes' | 'no' | 'nomatter'
  daybreak?: number | string
}

interface Props {
  values: FilterValues
  onChange: (v: FilterValues) => void
  onFetch: () => void
  onReset: () => void
  loading: boolean
}

const ORIGIN_OPTIONS = [
  { value: '', label: 'Any Origin' },
  { value: 'brute', label: 'Brute' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'stealer', label: 'Stealer' },
  { value: 'personal', label: 'Personal' },
  { value: 'resale', label: 'Resale' },
  { value: 'autoreg', label: 'Autoreger' },
  { value: 'self_registration', label: 'Self Reg.' },
]

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BR', name: 'Brazil' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LB', name: 'Lebanon' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MX', name: 'Mexico' }, { code: 'MD', name: 'Moldova' },
  { code: 'MA', name: 'Morocco' }, { code: 'MM', name: 'Myanmar' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NG', name: 'Nigeria' }, { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' }, { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'UAE' }, { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
]

function ToggleButton({ label, filterKey, values, onChange }: {
  label: string
  filterKey: 'premium' | 'password' | 'spam' | 'email'
  values: FilterValues
  onChange: (v: FilterValues) => void
}) {
  const val = values[filterKey] || 'nomatter'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', height: '36px'
      }}>
        {(['nomatter', 'no', 'yes'] as const).map((opt, i) => (
          <button key={opt} onClick={() => onChange({ ...values, [filterKey]: opt })} className={val === opt ? 'active' : ''} style={{
            fontSize: '12px',
            fontWeight: val === opt ? 600 : 400,
            background: val === opt
              ? 'var(--accent)'
              : 'transparent',
            color: val === opt
              ? '#ffffff'
              : 'var(--text-muted)',
            border: 'none',
            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}>
            {opt === 'nomatter' ? 'Any' : opt === 'yes' ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FilterPanel({ values, onChange, onFetch, onReset, loading }: Props) {
  const [countrySearch, setCountrySearch] = useState('')
  const selectedCountries = values.country || []

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      onChange({ ...values, country: selectedCountries.filter(c => c !== code) })
    } else {
      onChange({ ...values, country: [...selectedCountries, code] })
    }
    setCountrySearch('')
  }

  const filteredCountries = countrySearch.length >= 1
    ? COUNTRIES.filter(c =>
        !selectedCountries.includes(c.code) &&
        (c.name.toLowerCase().startsWith(countrySearch.toLowerCase()) ||
         c.code.toLowerCase() === countrySearch.toLowerCase())
      ).slice(0, 7)
    : []

  const activeCount = Object.entries(values).filter(([k, v]) => {
    if (['premium', 'password', 'spam', 'email'].includes(k)) return v && v !== 'nomatter'
    if (k === 'country') return Array.isArray(v) && v.length > 0
    if (k === 'origin') return !!v
    return v !== undefined && v !== ''
  }).length

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em' }}>
          Filters {activeCount > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>({activeCount})</span>}
        </h2>
        {activeCount > 0 && (
          <button onClick={onReset} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: 'inherit', fontWeight: 500, transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <RotateCcw size={14} /> Clear
          </button>
        )}
      </div>

      {/* Main Grid Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        
        {/* Price */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price (USD)</label>
          <div style={{ display: 'flex', gap: '8px', height: '36px' }}>
            <input type="number" className="input-base" placeholder="Min" min={0}
              style={{ fontSize: '13px', width: '100%', padding: '0 12px' }}
              value={values.pmin as string || ''}
              onChange={e => onChange({ ...values, pmin: e.target.value || undefined })}
            />
            <input type="number" className="input-base" placeholder="Max" min={0}
              style={{ fontSize: '13px', width: '100%', padding: '0 12px' }}
              value={values.pmax as string || ''}
              onChange={e => onChange({ ...values, pmax: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Origin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origin</label>
          <select className="input-base"
            style={{ fontSize: '13px', height: '36px', padding: '0 28px 0 12px' }}
            value={values.origin || ''}
            onChange={e => onChange({ ...values, origin: e.target.value || undefined })}
          >
            {ORIGIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Days Offline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last active (max days)</label>
          <input type="number" className="input-base" placeholder="e.g. 30" min={1}
            style={{ fontSize: '13px', height: '36px', padding: '0 12px' }}
            value={values.daybreak as string || ''}
            onChange={e => onChange({ ...values, daybreak: e.target.value || undefined })}
          />
        </div>
        
        {/* Country */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Country {selectedCountries.length > 0 && `(${selectedCountries.length})`}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="input-base"
              type="text"
              placeholder="Search country..."
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              autoComplete="off"
              style={{ fontSize: '13px', height: '36px', padding: '0 12px', width: '100%' }}
            />
            {filteredCountries.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: '0', right: '0',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '4px', zIndex: 20, overflow: 'hidden',
                boxShadow: 'var(--shadow-subtle)',
              }}>
                {filteredCountries.map(c => (
                  <button key={c.code} onClick={() => toggleCountry(c.code)} style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: 'inherit', transition: 'background 0.15s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCountries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {selectedCountries.map(code => {
                const c = COUNTRIES.find(x => x.code === code)
                return (
                  <button key={code} onClick={() => toggleCountry(code)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', borderRadius: '4px',
                    padding: '4px 8px', fontSize: '12px', fontWeight: 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {c?.name || code} ×
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

      <div style={{ height: '1px', background: 'var(--border)' }} />

      {/* Toggles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <ToggleButton label="Telegram Premium" filterKey="premium" values={values} onChange={onChange} />
        <ToggleButton label="2FA / Cloud Password" filterKey="password" values={values} onChange={onChange} />
        <ToggleButton label="Spam Block" filterKey="spam" values={values} onChange={onChange} />
        <ToggleButton label="Login Email" filterKey="email" values={values} onChange={onChange} />
      </div>

      {/* Search Button Area */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          className="btn-primary"
          onClick={onFetch}
          disabled={loading}
          style={{ 
            borderRadius: '4px', fontSize: '14px', padding: '10px 24px', 
            minWidth: '200px', display: 'flex', justifyContent: 'center' 
          }}
        >
          {loading ? <><span className="spinner" /><span>Searching...</span></> : <><Search size={16} /><span>Search Accounts</span></>}
        </button>
      </div>

    </div>
  )
}
