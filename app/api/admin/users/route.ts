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
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          balance: true,
          role: true,
          createdAt: true,
          _count: {
            select: { purchases: true, transactions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    // Convert BigInt to String for JSON serialization
    const formattedUsers = users.map(u => ({
      ...u,
      id: u.id.toString()
    }))

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Failed to get users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
