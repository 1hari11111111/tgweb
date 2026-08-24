// LZT Market API client — reads token dynamically from settings

import { getSettings } from './settings'

export interface LZTSearchParams {
  page?: number
  pmin?: number
  pmax?: number
  title?: string
  order_by?: string
  currency?: string
  // Telegram-specific filters
  country?: string[]
  origin?: string[]
  spam?: 'yes' | 'no' | 'nomatter'
  password?: 'yes' | 'no' | 'nomatter'
  premium?: 'yes' | 'no' | 'nomatter'
  email?: 'yes' | 'no' | 'nomatter'
  daybreak?: number
  // Channels
  min_channels?: number
  max_channels?: number
  // Chats
  min_chats?: number
  max_chats?: number
  // Conversations
  min_conversations?: number
  max_conversations?: number
  // Admin
  min_admin?: number
  max_admin?: number
  min_admin_sub?: number
  max_admin_sub?: number
  // ID digits
  dig_min?: number
  dig_max?: number
  // Contacts
  min_contacts?: number
  max_contacts?: number
  // Stars
  min_stars?: number
  max_stars?: number
  // Gifts
  min_gifts?: number
  max_gifts?: number
  min_nft_gifts?: number
  max_nft_gifts?: number
  // Bots
  min_bots?: number
  max_bots?: number
  min_bot_active_users?: number
  max_bot_active_users?: number
  // Birthday
  birthday?: number
  birthday_period?: 'day' | 'month' | 'year'
  // Stars rating
  min_stars_rating_level?: number
  max_stars_rating_level?: number
  // Gram
  min_gram?: number
  max_gram?: number
}

export interface TelegramAccount {
  item_id: number
  item_state: string
  category_id: number
  published_date: number
  title: string
  description: string
  price: number
  price_currency: string
  rub_price: number
  view_count: number
  // Telegram fields
  telegram_item_id: number | null
  telegram_country: string | null
  telegram_last_seen: number | null
  telegram_premium: number | null
  telegram_stars_count: number | null
  telegram_birthday: number | null
  telegram_password: number | null
  telegram_premium_expires: number | null
  telegram_spam_block: string | null
  telegram_channels_count: number | null
  telegram_chats_count: number | null
  telegram_admin_count: number | null
  telegram_admin_subs_count: number | null
  telegram_conversations_count: number | null
  telegram_id_count: number | null
  telegram_contacts_count: number | null
  telegram_group_counters: {
    chats: number
    channels: number
    conversations: number
    admin: number
  } | null
  email_type: string | null
  email_provider: string | null
  seller: {
    user_id: number
    username: string
    sold_items_count: number
    active_items_count: number
  }
  canBuyItem: boolean
}

export interface LZTSearchResult {
  items: TelegramAccount[]
  totalItems: number
  hasNextPage: boolean
  perPage: number
  page: number
  wasCached: boolean
  inrExchangeRate: number
}

function getApiConfig() {
  const settings = getSettings()
  const BASE_URL = process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'
  const TOKEN = settings.lztApiToken || process.env.LZT_API_TOKEN || ''
  return { BASE_URL, TOKEN, profitPercent: settings.profitPercent, inrExchangeRate: settings.inrExchangeRate }
}

function buildHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
}

function applyProfit(price: number, profitPercent: number): number {
  if (!profitPercent || profitPercent <= 0) return price
  return Math.round(price * (1 + profitPercent / 100) * 100) / 100
}

export async function searchTelegramAccounts(params: LZTSearchParams): Promise<LZTSearchResult> {
  const { BASE_URL, TOKEN, profitPercent, inrExchangeRate } = getApiConfig()
  const url = new URL(`${BASE_URL}/telegram`)

  // Add all defined params to query string
  const addParam = (key: string, value: string | number | boolean | undefined) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  addParam('page', params.page)
  addParam('limit', 50) // Fetch 50 items per page
  addParam('pmin', params.pmin)
  addParam('pmax', params.pmax)
  addParam('title', params.title)
  addParam('order_by', params.order_by)
  addParam('currency', params.currency)
  addParam('spam', params.spam)
  addParam('password', params.password)
  addParam('premium', params.premium)
  addParam('email', params.email)
  addParam('daybreak', params.daybreak)
  addParam('min_channels', params.min_channels)
  addParam('max_channels', params.max_channels)
  addParam('min_chats', params.min_chats)
  addParam('max_chats', params.max_chats)
  addParam('min_conversations', params.min_conversations)
  addParam('max_conversations', params.max_conversations)
  addParam('min_admin', params.min_admin)
  addParam('max_admin', params.max_admin)
  addParam('min_admin_sub', params.min_admin_sub)
  addParam('max_admin_sub', params.max_admin_sub)
  addParam('dig_min', params.dig_min)
  addParam('dig_max', params.dig_max)
  addParam('min_contacts', params.min_contacts)
  addParam('max_contacts', params.max_contacts)
  addParam('min_stars', params.min_stars)
  addParam('max_stars', params.max_stars)
  addParam('min_gifts', params.min_gifts)
  addParam('max_gifts', params.max_gifts)
  addParam('min_nft_gifts', params.min_nft_gifts)
  addParam('max_nft_gifts', params.max_nft_gifts)
  addParam('min_bots', params.min_bots)
  addParam('max_bots', params.max_bots)
  addParam('min_bot_active_users', params.min_bot_active_users)
  addParam('max_bot_active_users', params.max_bot_active_users)
  addParam('birthday', params.birthday)
  addParam('birthday_period', params.birthday_period)
  addParam('min_stars_rating_level', params.min_stars_rating_level)
  addParam('max_stars_rating_level', params.max_stars_rating_level)
  addParam('min_gram', params.min_gram)
  addParam('max_gram', params.max_gram)

  // Array params (LZT uses bracket notation: country[], origin[])
  if (params.country && params.country.length > 0) {
    params.country.forEach(c => url.searchParams.append('country[]', c))
  }
  if (params.origin && params.origin.length > 0) {
    params.origin.forEach(o => url.searchParams.append('origin[]', o))
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url.toString(), {
      headers: buildHeaders(TOKEN),
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeout)

    if (res.status === 429) {
      throw new Error('RATE_LIMITED')
    }

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED')
    }

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`)
    }

    const data = await res.json()

    // Apply profit markup to prices
    const items = (data.items || []).map((item: TelegramAccount) => ({
      ...item,
      price: applyProfit(item.price, profitPercent),
      rub_price: applyProfit(item.rub_price, profitPercent),
    }))

    return {
      items,
      totalItems: data.totalItems || 0,
      hasNextPage: data.hasNextPage || false,
      perPage: data.perPage || 50,
      page: data.page || 1,
      wasCached: data.wasCached || false,
      inrExchangeRate: inrExchangeRate || 84,
    }
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

export async function getTelegramAccount(itemId: number): Promise<TelegramAccount> {
  const { BASE_URL, TOKEN, profitPercent } = getApiConfig()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${BASE_URL}/${itemId}`, {
      headers: buildHeaders(TOKEN),
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`)
    }

    const data = await res.json()
    const item = data.item

    // Apply profit markup
    return {
      ...item,
      price: applyProfit(item.price, profitPercent),
      rub_price: applyProfit(item.rub_price, profitPercent),
    }
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}
