import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const userId = BigInt(sessionUser.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, createdAt: true, username: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const deposits = await prisma.transaction.aggregate({
      where: { userId, type: 'DEPOSIT', status: 'APPROVED' },
      _sum: { amount: true }
    })

    const purchases = await prisma.purchase.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { priceInr: true }
    })

    return NextResponse.json({
      username: user.username,
      balance: user.balance,
      createdAt: user.createdAt,
      totalDeposited: deposits._sum.amount || 0,
      totalPurchases: purchases._count.id || 0,
      totalSpent: purchases._sum.priceInr || 0,
    })
  } catch (error) {
    console.error('Failed to get profile stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
