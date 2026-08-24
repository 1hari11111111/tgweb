import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  lztApiToken: string
  profitPercent: number
  inrExchangeRate: number
  upiId: string
  adminChatId: string
}

const SETTINGS_PATH = join(process.cwd(), 'data', 'settings.json')

function ensureSettingsFile() {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  if (!existsSync(SETTINGS_PATH)) {
    const defaults: AppSettings = {
      lztApiToken: process.env.LZT_API_TOKEN || '',
      profitPercent: 0,
      inrExchangeRate: 84.00,
      upiId: '',
      adminChatId: '',
    }
    writeFileSync(SETTINGS_PATH, JSON.stringify(defaults, null, 2), 'utf-8')
    return defaults
  }
  return null
}

export function getSettings(): AppSettings {
  const created = ensureSettingsFile()
  if (created) return created

  try {
    const raw = readFileSync(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as AppSettings

    // Fall back to env var if token in settings is empty
    if (!parsed.lztApiToken) {
      parsed.lztApiToken = process.env.LZT_API_TOKEN || ''
    }

    return {
      lztApiToken: parsed.lztApiToken || '',
      profitPercent: parsed.profitPercent ?? 0,
      inrExchangeRate: parsed.inrExchangeRate ?? 84.00,
      upiId: parsed.upiId || '',
      adminChatId: parsed.adminChatId || '',
    }
  } catch {
    return {
      lztApiToken: process.env.LZT_API_TOKEN || '',
      profitPercent: 0,
      inrExchangeRate: 84.00,
      upiId: '',
      adminChatId: '',
    }
  }
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated: AppSettings = {
    lztApiToken: updates.lztApiToken !== undefined ? updates.lztApiToken : current.lztApiToken,
    profitPercent: updates.profitPercent !== undefined ? updates.profitPercent : current.profitPercent,
    inrExchangeRate: updates.inrExchangeRate !== undefined ? updates.inrExchangeRate : current.inrExchangeRate,
    upiId: updates.upiId !== undefined ? String(updates.upiId) : current.upiId,
    adminChatId: updates.adminChatId !== undefined ? String(updates.adminChatId) : current.adminChatId,
  }

  ensureSettingsFile()
  writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')

  return updated
}

export function maskToken(token: string): string {
  if (!token || token.length < 8) return token ? '••••••••' : ''
  return '••••••••••••' + token.slice(-4)
}
