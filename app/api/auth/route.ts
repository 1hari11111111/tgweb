import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { validateInitData, parseInitData } from '@/lib/twa'
import { getSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  const { initData } = await request.json()
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!initData || !botToken) {
    return NextResponse.json({ error: 'Missing data or token' }, { status: 400 })
  }

  // Dev Mode Mock
  if (initData === 'mock_admin_data' && process.env.NODE_ENV === 'development') {
    const user = await prisma.user.upsert({
      where: { id: BigInt(123456789) },
      update: {},
      create: {
        id: BigInt(123456789),
        username: 'AdminTest',
        balance: 1000,
        role: 'ADMIN',
      }
    })
    return NextResponse.json({
      success: true,
      user: { ...user, id: user.id.toString() },
      upiId: getSettings().upiId
    })
  }

  const isValid = validateInitData(initData, botToken)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid authentication signature' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  if (!tgUser) {
    return NextResponse.json({ error: 'Could not parse user data' }, { status: 400 })
  }

  // Create or update user
  const user = await prisma.user.upsert({
    where: { id: BigInt(tgUser.id) },
    update: { username: tgUser.username },
    create: {
      id: BigInt(tgUser.id),
      username: tgUser.username,
      balance: 0,
      role: 'USER',
    }
  })

  // Convert BigInt to string for JSON serialization
  return NextResponse.json({
    success: true,
    user: {
      ...user,
      id: user.id.toString(),
    },
    upiId: getSettings().upiId
  })
}
