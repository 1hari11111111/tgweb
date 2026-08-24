import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { validateInitData, parseInitData } from '@/lib/twa'
import { bot } from '@/lib/bot'
import { getSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  const { initData, amount, reference } = await request.json()
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!initData || !botToken || !amount || !reference) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const isValid = validateInitData(initData, botToken)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid authentication signature' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  if (!tgUser) {
    return NextResponse.json({ error: 'Could not parse user data' }, { status: 400 })
  }

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  try {
    const tx = await prisma.transaction.create({
      data: {
        userId: BigInt(tgUser.id),
        type: 'DEPOSIT',
        amount: numAmount,
        currency: 'INR',
        status: 'PENDING',
        reference: reference,
      }
    })

    const settings = getSettings()
    
    // Notify Admin via Telegram
    if (settings.adminChatId && bot) {
      const message = `🔔 <b>New Deposit Request</b>\n\nUser ID: <code>${tgUser.id}</code>\nAmount: ₹${numAmount}\nUTR: <code>${reference}</code>`
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `approve_deposit_${tx.id}` },
            { text: '❌ Reject', callback_data: `reject_deposit_${tx.id}` }
          ],
          [
            { text: '✏️ Custom Amount', callback_data: `custom_deposit_${tx.id}` }
          ]
        ]
      }

      await bot.sendMessage(settings.adminChatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      transactionId: tx.id,
      message: 'Deposit request submitted. Waiting for admin approval.'
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
