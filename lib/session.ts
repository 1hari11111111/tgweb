import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'

export interface SessionUser {
  id: string
  username: string
  balance: number
  role: string
}

export async function getSessionUser(request?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined

    if (request) {
      token = request.cookies.get('session_token')?.value
    } else {
      const cookieStore = await cookies()
      token = cookieStore.get('session_token')?.value
    }

    if (!token) return null

    // token is "userId:secret" format
    const [userIdStr] = token.split(':')
    if (!userIdStr) return null

    const user = await prisma.user.findUnique({ where: { id: BigInt(userIdStr) } })
    if (!user) return null

    return {
      id: user.id.toString(),
      username: user.username || 'User',
      balance: user.balance,
      role: user.role,
    }
  } catch {
    return null
  }
}

export function makeSessionToken(userId: string): string {
  return `${userId}:${Date.now()}`
}
