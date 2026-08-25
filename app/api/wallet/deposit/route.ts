import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { getSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { amount, reference } = await request.json()

    if (!amount || !reference) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const tx = await prisma.transaction.create({
      data: {
        userId: BigInt(sessionUser.id),
        type: 'DEPOSIT',
        amount: numAmount,
        currency: 'INR',
        status: 'PENDING',
        reference: reference,
      }
    })

    const settings = await getSettings()

    // Log deposit to admin chat (optional, no Telegram requirement)
    console.log(`[Deposit] User ${sessionUser.username} (${sessionUser.id}) requested ₹${numAmount} — UTR: ${reference} — TxID: ${tx.id}`)

    return NextResponse.json({
      success: true,
      transactionId: tx.id,
      message: 'Deposit request submitted. Waiting for admin approval.',
      adminContactHint: settings.adminChatId || null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
