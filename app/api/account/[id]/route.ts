import { NextRequest, NextResponse } from 'next/server'
import { getTelegramAccount } from '@/lib/lzt'
import { getSettings } from '@/lib/settings'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const itemId = parseInt(id)

  if (isNaN(itemId)) {
    return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
  }

  try {
    const account = await getTelegramAccount(itemId)
    const settings = await getSettings()
    return NextResponse.json({ 
      item: account,
      inrExchangeRate: settings.inrExchangeRate || 84
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error(`[API /account/${id}] Error:`, message)
    return NextResponse.json(
      { error: 'Unable to fetch account details.', details: message },
      { status: 500 }
    )
  }
}
