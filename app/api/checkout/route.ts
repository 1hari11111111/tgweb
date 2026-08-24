import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { validateInitData, parseInitData } from '@/lib/twa'
import { getTelegramAccount } from '@/lib/lzt'
import { getSettings } from '@/lib/settings'
import { sendTelegramMessage, bot } from '@/lib/bot'

export async function POST(request: NextRequest) {
  const { initData, itemId } = await request.json()
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!initData || !itemId || !botToken) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
  }

  const isValid = validateInitData(initData, botToken)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tgUser = parseInitData(initData)
  if (!tgUser) return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { id: BigInt(tgUser.id) } })
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

    // 4. BUY FROM LZT (Simulated / API Call)
    // NOTE: Replace this with the actual LZT /fast-buy endpoint
    const LZT_TOKEN = settings.lztApiToken
    const buyRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}/fast-buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LZT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!buyRes.ok) {
      // If purchase fails, refund the user
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
      return NextResponse.json({ error: 'Failed to purchase from supplier. Refunded.' }, { status: 500 })
    }

    // 5. SEND TO TELEGRAM BOT
    if (bot) {
      try {
        const downloadRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}/download`, {
          headers: { 'Authorization': `Bearer ${LZT_TOKEN}` }
        })

        if (downloadRes.ok) {
          const contentType = downloadRes.headers.get('content-type') || ''
          const buffer = Buffer.from(await downloadRes.arrayBuffer())
          
          let ext = '.txt'
          if (contentType.includes('zip')) ext = '.zip'
          else if (contentType.includes('json')) ext = '.json'

          await bot.sendDocument(tgUser.id, buffer, { 
            filename: `Account_${itemId}${ext}` 
          }, { 
            caption: `🎉 <b>Purchase Successful!</b>\n\nHere is your purchased Telegram Account #${itemId}.` 
          })
        } else {
          await sendTelegramMessage(
            tgUser.id, 
            `🎉 <b>Purchase Successful!</b>\n\nYou have purchased Telegram Account #${itemId}, but we failed to auto-download the file. Please contact support to receive your file.`
          )
        }
      } catch (err) {
        console.error("Error sending file:", err)
        await sendTelegramMessage(tgUser.id, `🎉 Purchase successful (Account #${itemId}), but file delivery failed.`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
