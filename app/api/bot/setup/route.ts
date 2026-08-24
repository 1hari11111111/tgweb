import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/bot'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'Please provide a ?url= parameter with your domain (e.g. https://your-domain.com)' }, { status: 400 })
  }

  if (!bot) {
    return NextResponse.json({ error: 'Telegram Bot not initialized. Check TELEGRAM_BOT_TOKEN.' }, { status: 500 })
  }

  try {
    const webhookUrl = `${url}/api/bot/webhook`
    await bot.setWebHook(webhookUrl)
    
    return NextResponse.json({ 
      success: true, 
      message: `Webhook successfully set to ${webhookUrl}`
    })
  } catch (err: any) {
    console.error('Error setting webhook:', err)
    return NextResponse.json({ error: 'Failed to set webhook', details: err.message }, { status: 500 })
  }
}
