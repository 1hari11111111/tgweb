import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const skip = (page - 1) * limit
    const userId = BigInt(sessionUser.id)

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where: { userId } })
    ])

    return NextResponse.json({
      purchases,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Failed to get purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase history' }, { status: 500 })
  }
}
