import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getTelegramAccount } from '@/lib/lzt'
import { getSettings } from '@/lib/settings'
import { getSessionUser } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { itemId } = await request.json()
    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(sessionUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 1. Fetch current price from supplier
    const account = await getTelegramAccount(itemId)
    const settings = getSettings()
    const costInr = account.price * (settings.inrExchangeRate || 84)

    // 2. Check balance
    if (user.balance < costInr) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // 3. Deduct Balance and Record Transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: costInr } }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: costInr,
          currency: 'INR',
          status: 'APPROVED',
          reference: String(itemId),
        }
      })
    ])

    // 4. BUY FROM LZT
    const LZT_TOKEN = settings.lztApiToken
    const buyRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}/fast-buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LZT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!buyRes.ok) {
      // Refund the user
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { increment: costInr } }
      })
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'REFUND',
          amount: costInr,
          currency: 'INR',
          status: 'APPROVED',
          reference: String(itemId),
        }
      })
      
      // Parse specific LZT error
      let errorMessage = 'Failed to purchase from supplier.'
      try {
        const errorData = await buyRes.json()
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0]
        }
      } catch (e) {}

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // 5. Try to get download URL for the account file
    let downloadUrl: string | null = null
    try {
      const downloadRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}/download`, {
        headers: { 'Authorization': `Bearer ${LZT_TOKEN}` }
      })
      if (downloadRes.ok) {
        const downloadData = await downloadRes.json().catch(() => null)
        downloadUrl = downloadData?.url || null
      }
    } catch {
      console.error('Download URL fetch failed')
    }

    return NextResponse.json({ success: true, downloadUrl })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
