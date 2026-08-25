const TelegramBot = require('node-telegram-bot-api')

let botInstance: any = null

export function getBot() {
  if (botInstance) return botInstance
  
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null
  
  botInstance = new TelegramBot(token, { polling: false })
  return botInstance
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const bot = getBot()
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
  const bot = getBot()
  if (!bot) return
  try {
    await bot.sendDocument(chatId, document, { caption }, { filename })
  } catch (err) {
    console.error('Failed to send telegram document', err)
  }
}
