import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendTelegramMessage, bot } from '@/lib/bot'
import { getSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Handle /start command
    if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id
      const host = request.headers.get('host') || 'vaishustore.duckdns.org'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const siteUrl = `${protocol}://${host}`
      
      if (bot) {
        await bot.sendMessage(chatId, 'Welcome to the TGAccounts Marketplace! Click the button below to open the store and browse available accounts.', {
          reply_markup: {
            inline_keyboard: [[
              { text: '🛒 Open Store', web_app: { url: siteUrl } }
            ]]
          }
        }).catch(console.error)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle Callback Query (Button clicks)
    if (update.callback_query) {
      const query = update.callback_query
      const data = query.data // e.g., approve_deposit_123
      const chatId = query.message?.chat.id
      const messageId = query.message?.message_id
      const settings = getSettings()

      // Basic Auth: Check if it's the admin chat
      if (String(chatId) !== settings.adminChatId) {
        return NextResponse.json({ ok: true })
      }

      const match = data.match(/^(approve|reject|custom)_deposit_(.+)$/)
      if (match && chatId && messageId) {
        const action = match[1]
        const depositId = match[2]

        const transaction = await prisma.transaction.findUnique({
          where: { id: depositId },
          include: { user: true }
        })

        if (!transaction || transaction.status !== 'PENDING') {
          if (bot) {
            await bot.editMessageText('This deposit is already processed or not found.', {
              chat_id: chatId,
              message_id: messageId
            }).catch(console.error)
          }
          return NextResponse.json({ ok: true })
        }

        if (action === 'approve') {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: depositId },
              data: { status: 'APPROVED' }
            }),
            prisma.user.update({
              where: { id: transaction.userId },
              data: { balance: { increment: transaction.amount } }
            })
          ])
          
          if (bot) {
            await bot.editMessageText(`✅ <b>Deposit Approved</b>\n\nUser ID: ${transaction.userId}\nAmount: ₹${transaction.amount}\nUTR: ${transaction.reference}`, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'HTML'
            }).catch(console.error)
          }

          await sendTelegramMessage(transaction.userId.toString(), `✅ <b>Deposit Approved!</b>\n₹${transaction.amount} has been added to your wallet.`)
        } 
        else if (action === 'reject') {
          await prisma.transaction.update({
            where: { id: depositId },
            data: { status: 'REJECTED' }
          })
          
          if (bot) {
            await bot.editMessageText(`❌ <b>Deposit Rejected</b>\n\nUser ID: ${transaction.userId}\nAmount: ₹${transaction.amount}\nUTR: ${transaction.reference}`, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'HTML'
            }).catch(console.error)
          }

          await sendTelegramMessage(transaction.userId.toString(), `❌ <b>Deposit Rejected</b>\nYour deposit of ₹${transaction.amount} (UTR: ${transaction.reference}) was rejected. Contact support if this is a mistake.`)
        }
        else if (action === 'custom') {
          if (bot) {
            await bot.sendMessage(chatId, `Reply to this message with the custom INR amount to approve for Deposit #${depositId}.`, {
              reply_to_message_id: messageId,
              reply_markup: {
                force_reply: true
              }
            }).catch(console.error)
          }
        }
      }
    }

    // Handle Replies for Custom Amount
    if (update.message && update.message.reply_to_message) {
      const msg = update.message
      const replyTo = msg.reply_to_message
      const settings = getSettings()
      
      if (String(msg.chat.id) === settings.adminChatId && replyTo.text?.includes('Reply to this message with the custom INR amount to approve for Deposit #')) {
        const depositIdMatch = replyTo.text.match(/Deposit #([a-zA-Z0-9-]+)/)
        if (depositIdMatch) {
          const depositId = depositIdMatch[1]
          const customAmount = parseFloat(msg.text)

          if (isNaN(customAmount) || customAmount <= 0) {
            if (bot) await bot.sendMessage(msg.chat.id, "Invalid amount. Please reply with a valid number.").catch(console.error)
            return NextResponse.json({ ok: true })
          }

          const transaction = await prisma.transaction.findUnique({
            where: { id: depositId },
            include: { user: true }
          })

          if (transaction && transaction.status === 'PENDING') {
            await prisma.$transaction([
              prisma.transaction.update({
                where: { id: depositId },
                data: { status: 'APPROVED', amount: customAmount }
              }),
              prisma.user.update({
                where: { id: transaction.userId },
                data: { balance: { increment: customAmount } }
              })
            ])
            
            if (bot) await bot.sendMessage(msg.chat.id, `✅ Custom Deposit Approved for ₹${customAmount}`).catch(console.error)
            await sendTelegramMessage(transaction.userId.toString(), `✅ <b>Deposit Approved!</b>\n₹${customAmount} has been added to your wallet (Custom Amount).`)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}
