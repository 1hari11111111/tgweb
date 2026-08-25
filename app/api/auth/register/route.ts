import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { makeSessionToken } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    if (username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if username already taken
    const existing = await prisma.user.findFirst({ where: { username: username.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Generate a numeric ID (use timestamp + random)
    const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000))

    const user = await prisma.user.create({
      data: {
        id: userId,
        username: username.trim(),
        password: password,
        balance: 0,
        role: 'USER',
      } as any
    })

    const token = makeSessionToken(user.id.toString())
    const settings = getSettings()

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        username: user.username,
        balance: user.balance,
        role: user.role,
      },
      upiId: settings.upiId,
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
