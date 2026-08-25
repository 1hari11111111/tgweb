import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({
    adminChatId: settings.adminChatId || 'https://t.me/your_support_bot',
    mainChannelId: settings.mainChannelId || 'https://t.me/your_main_channel',
  })
}
