import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-password')
  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deposits = await prisma.transaction.findMany({
      where: { type: 'DEPOSIT' },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
    
    // Convert BigInt to String
    const formatted = deposits.map(d => ({
      ...d,
      userId: d.userId.toString(),
      user: { ...d.user, id: d.user.id.toString() }
    }))
    return NextResponse.json(formatted)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password, transactionId, action } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!transactionId || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  try {
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!tx || tx.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction not found or already processed' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: 'APPROVED' }
        }),
        prisma.user.update({
          where: { id: tx.userId },
          data: { balance: { increment: tx.amount } }
        })
      ])
    } else {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REJECTED' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 })
  }
}
