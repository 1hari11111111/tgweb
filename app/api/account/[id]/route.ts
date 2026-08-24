import { NextRequest, NextResponse } from 'next/server'
import { getTelegramAccount } from '@/lib/lzt'

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
    return NextResponse.json({ item: account })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error(`[API /account/${id}] Error:`, message)
    return NextResponse.json(
      { error: 'Unable to fetch account details.' },
      { status: 500 }
    )
  }
}
