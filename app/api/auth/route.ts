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

    // Find user by username
    const user = await prisma.user.findFirst({ where: { username } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Simple password check — stored in user.passwordHash as plaintext for now
    const userRecord = user as any
    if (userRecord.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

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
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

// GET: return current session user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    if (!token) return NextResponse.json({ user: null })

    const [userIdStr] = token.split(':')
    if (!userIdStr) return NextResponse.json({ user: null })

    const user = await prisma.user.findUnique({ where: { id: BigInt(userIdStr) } })
    if (!user) return NextResponse.json({ user: null })

    const settings = getSettings()

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        username: user.username,
        balance: user.balance,
        role: user.role,
      },
      upiId: settings.upiId,
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}

// DELETE: logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('session_token', '', { maxAge: 0, path: '/' })
  return response
}
