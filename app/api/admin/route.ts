import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings, maskToken } from '@/lib/settings'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  // Verify auth
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = getSettings()
  return NextResponse.json({
    lztApiToken: maskToken(settings.lztApiToken),
    profitPercent: settings.profitPercent,
    inrExchangeRate: settings.inrExchangeRate,
    upiId: settings.upiId,
    adminChatId: settings.adminChatId,
    hasToken: !!settings.lztApiToken,
  })
}

export async function POST(request: NextRequest) {
  // Verify auth
  const body = await request.json()
  const { password, lztApiToken, profitPercent, inrExchangeRate, upiId, adminChatId } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates: Record<string, unknown> = {}

  if (lztApiToken !== undefined) {
    updates.lztApiToken = lztApiToken
  }

  if (profitPercent !== undefined) {
    const pct = Number(profitPercent)
    if (isNaN(pct) || pct < 0 || pct > 1000) {
      return NextResponse.json({ error: 'Profit must be between 0 and 1000%' }, { status: 400 })
    }
    updates.profitPercent = pct
  }

  if (inrExchangeRate !== undefined) {
    const rate = Number(inrExchangeRate)
    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json({ error: 'Exchange rate must be > 0' }, { status: 400 })
    }
    updates.inrExchangeRate = rate
  }

  if (upiId !== undefined) {
    updates.upiId = String(upiId)
  }

  if (adminChatId !== undefined) {
    updates.adminChatId = String(adminChatId)
  }

  const updated = updateSettings(updates)

  return NextResponse.json({
    success: true,
    lztApiToken: maskToken(updated.lztApiToken),
    profitPercent: updated.profitPercent,
    inrExchangeRate: updated.inrExchangeRate,
    upiId: updated.upiId,
    adminChatId: updated.adminChatId,
    hasToken: !!updated.lztApiToken,
  })
}
