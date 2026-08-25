import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'
import { getSessionUser } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return new NextResponse('Not authenticated', { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'tdata' // tdata, session_telethon, session_pyrogram, json

  const settings = await getSettings()
  const LZT_TOKEN = settings.lztApiToken

  if (!LZT_TOKEN) {
    return new NextResponse('Missing API Token', { status: 500 })
  }

  const lztBaseUrl = process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'

  try {
    const res = await fetch(`${lztBaseUrl}/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${LZT_TOKEN}`,
        'Accept': 'application/json',
      }
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error')
      console.error(`LZT Download Error (${type}):`, res.status, errText)
      return NextResponse.json(
        { error: `Download failed: ${res.status}` },
        { status: res.status }
      )
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'

    const fileExtensions: Record<string, string> = {
      tdata: 'zip',
      session_telethon: 'session',
      session_pyrogram: 'session',
      json: 'json',
    }

    const ext = fileExtensions[type] || 'zip'
    const filename = `account_${id}_${type}.${ext}`

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(res.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Download Proxy Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
