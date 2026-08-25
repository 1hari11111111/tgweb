import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'
import { getSessionUser } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params
  const settings = await getSettings()
  const LZT_TOKEN = settings.lztApiToken
  const lztBaseUrl = process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'

  try {
    const res = await fetch(`${lztBaseUrl}/${id}/telegram-login-code`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LZT_TOKEN}`,
        'Accept': 'application/json',
      }
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: data.errors?.[0] || 'Failed to get login code' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Login code error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
