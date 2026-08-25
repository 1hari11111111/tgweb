import prisma from './db'

export interface SettingsData {
  lztApiToken: string
  profitPercent: number
  inrExchangeRate: number
  upiId: string
  adminChatId: string
}

const DEFAULT_SETTINGS: SettingsData = {
  lztApiToken: '',
  profitPercent: 50,
  inrExchangeRate: 84,
  upiId: '',
  adminChatId: '',
}

// In-memory cache to prevent excessive DB queries on every request
let settingsCache: SettingsData | null = null
let lastFetch = 0
const CACHE_TTL = 60000 // 1 minute

export async function getSettings(): Promise<SettingsData> {
  if (settingsCache && Date.now() - lastFetch < CACHE_TTL) {
    return settingsCache
  }

  try {
    const settings = await prisma.settings.findMany()
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    settingsCache = {
      lztApiToken: settingsMap['lztApiToken'] || DEFAULT_SETTINGS.lztApiToken,
      profitPercent: settingsMap['profitPercent'] ? Number(settingsMap['profitPercent']) : DEFAULT_SETTINGS.profitPercent,
      inrExchangeRate: settingsMap['inrExchangeRate'] ? Number(settingsMap['inrExchangeRate']) : DEFAULT_SETTINGS.inrExchangeRate,
      upiId: settingsMap['upiId'] || DEFAULT_SETTINGS.upiId,
      adminChatId: settingsMap['adminChatId'] || DEFAULT_SETTINGS.adminChatId,
    }
    lastFetch = Date.now()
    return settingsCache
  } catch (error) {
    console.error('Failed to get settings from DB:', error)
    return settingsCache || DEFAULT_SETTINGS
  }
}

export async function updateSettings(updates: Partial<SettingsData>) {
  const current = await getSettings()
  const updated = { ...current, ...updates }

  try {
    // Upsert all settings sequentially
    const keys = Object.keys(updated) as (keyof SettingsData)[]
    for (const key of keys) {
      const val = updated[key]
      await prisma.settings.upsert({
        where: { key: key },
        update: { value: String(val) },
        create: { key: key, value: String(val) },
      })
    }
    settingsCache = updated
    lastFetch = Date.now()
    return updated
  } catch (error) {
    console.error('Failed to update settings in DB:', error)
    return current
  }
}

export function maskToken(token: string): string {
  if (!token || token.length < 10) return ''
  return token.slice(0, 6) + '...' + token.slice(-4)
}
