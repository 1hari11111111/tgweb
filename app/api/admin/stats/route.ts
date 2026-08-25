import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const totalUsers = await prisma.user.count()
    
    const revenue = await prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'APPROVED' },
      _sum: { amount: true }
    })

    const totalPurchases = await prisma.purchase.count()
    
    const accountsSold = await prisma.purchase.aggregate({
      _sum: { priceInr: true }
    })

    const activeBalance = await prisma.user.aggregate({
      _sum: { balance: true }
    })

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayPurchases = await prisma.purchase.count({
      where: { createdAt: { gte: startOfToday } }
    })

    return NextResponse.json({
      totalUsers,
      totalRevenue: revenue._sum.amount || 0,
      totalPurchases,
      todayPurchases,
      totalSoldAmount: accountsSold._sum.priceInr || 0,
      activeUserBalance: activeBalance._sum.balance || 0,
    })
  } catch (error) {
    console.error('Failed to get admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
