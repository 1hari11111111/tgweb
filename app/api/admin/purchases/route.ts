import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { username: true }
          }
        }
      }),
      prisma.purchase.count()
    ])

    const formattedPurchases = purchases.map(p => ({
      ...p,
      userId: p.userId.toString()
    }))

    return NextResponse.json({
      purchases: formattedPurchases,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Failed to get admin purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}
