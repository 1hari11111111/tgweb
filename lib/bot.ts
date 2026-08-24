const TelegramBot = require('node-telegram-bot-api')

const token = process.env.TELEGRAM_BOT_TOKEN || ''
export const bot = token ? new TelegramBot(token, { polling: false }) : null

export async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!bot) {
    console.error('Bot token is missing. Message not sent.')
    return
  }
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' })
  } catch (err) {
    console.error('Failed to send telegram message', err)
  }
}

export async function sendTelegramDocument(chatId: string | number, document: Buffer, filename: string, caption?: string) {
  if (!bot) return
  try {
    await bot.sendDocument(chatId, document, { caption }, { filename })
  } catch (err) {
    console.error('Failed to send telegram document', err)
  }
}
