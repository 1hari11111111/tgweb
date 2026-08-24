import { NextRequest, NextResponse } from 'next/server'
import { searchTelegramAccounts, LZTSearchParams } from '@/lib/lzt'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Build LZT params from query string - only documented params passed through
  const params: LZTSearchParams = {}

  const page = searchParams.get('page')
  if (page) params.page = parseInt(page)

  const pmin = searchParams.get('pmin')
  if (pmin) params.pmin = parseFloat(pmin)

  const pmax = searchParams.get('pmax')
  if (pmax) params.pmax = parseFloat(pmax)

  const title = searchParams.get('title')
  if (title) params.title = title

  const order_by = searchParams.get('order_by')
  if (order_by) params.order_by = order_by

  const currency = searchParams.get('currency')
  if (currency) params.currency = currency

  const spam = searchParams.get('spam') as 'yes' | 'no' | 'nomatter' | null
  if (spam && ['yes', 'no', 'nomatter'].includes(spam)) params.spam = spam

  const password = searchParams.get('password') as 'yes' | 'no' | 'nomatter' | null
  if (password && ['yes', 'no', 'nomatter'].includes(password)) params.password = password

  const premium = searchParams.get('premium') as 'yes' | 'no' | 'nomatter' | null
  if (premium && ['yes', 'no', 'nomatter'].includes(premium)) params.premium = premium

  const email = searchParams.get('email') as 'yes' | 'no' | 'nomatter' | null
  if (email && ['yes', 'no', 'nomatter'].includes(email)) params.email = email

  const daybreak = searchParams.get('daybreak')
  if (daybreak) params.daybreak = parseInt(daybreak)

  const country = searchParams.getAll('country[]')
  if (country.length > 0) params.country = country

  // origin[] is a single value sent as "origin[]"
  const origin = searchParams.get('origin[]') || searchParams.get('origin')
  if (origin) params.origin = [origin]

  // Numeric range params
  const numericParams: Array<keyof LZTSearchParams> = [
    'min_channels', 'max_channels', 'min_chats', 'max_chats',
    'min_conversations', 'max_conversations', 'min_admin', 'max_admin',
    'min_admin_sub', 'max_admin_sub', 'dig_min', 'dig_max',
    'min_contacts', 'max_contacts', 'min_stars', 'max_stars',
    'min_gifts', 'max_gifts', 'min_nft_gifts', 'max_nft_gifts',
    'min_bots', 'max_bots', 'min_bot_active_users', 'max_bot_active_users',
    'min_stars_rating_level', 'max_stars_rating_level', 'min_gram', 'max_gram',
    'birthday',
  ]

  for (const key of numericParams) {
    const val = searchParams.get(key)
    if (val) {
      // @ts-ignore
      params[key] = parseInt(val)
    }
  }

  const birthday_period = searchParams.get('birthday_period') as 'day' | 'month' | 'year' | null
  if (birthday_period) params.birthday_period = birthday_period

  try {
    const result = await searchTelegramAccounts(params)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      )
    }
    if (message === 'AbortError' || message.includes('abort')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      )
    }

    console.error('[API /telegram] Error:', message)
    return NextResponse.json(
      { error: 'Unable to fetch accounts. Please try again.' },
      { status: 500 }
    )
  }
}
