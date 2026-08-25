import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getTelegramAccount } from '@/lib/lzt'
import { getSettings } from '@/lib/settings'
import { getSessionUser } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { itemId } = await request.json()
    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(sessionUser.id) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 1. Fetch current price from supplier
    const account = await getTelegramAccount(itemId)
    const settings = await getSettings()
    const costInr = account.price * (settings.inrExchangeRate || 84)

    // 2. Check balance
    if (user.balance < costInr) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // 3. Deduct Balance and Record Transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: costInr } }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: costInr,
          currency: 'INR',
          status: 'APPROVED',
          reference: String(itemId),
        }
      })
    ])

    // 4. BUY FROM LZT
    const LZT_TOKEN = settings.lztApiToken
    const buyRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}/fast-buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LZT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!buyRes.ok) {
      // Refund the user
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { increment: costInr } }
      })
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'REFUND',
          amount: costInr,
          currency: 'INR',
          status: 'APPROVED',
          reference: String(itemId),
        }
      })
      
      // Parse specific LZT error
      let errorMessage = 'Failed to purchase from supplier.'
      try {
        const errorData = await buyRes.json()
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0]
        }
      } catch (e) {}

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // 5. After purchase, fetch item details (now includes login data since we own it)
    let loginData: any = null
    try {
      const buyData = await buyRes.json().catch(() => null)
      // The fast-buy response itself may contain the item
      if (buyData?.item) {
        loginData = {
          phoneNumber: buyData.item.telegramLoginData?.phone_number || buyData.item.telegram_phone_number || null,
          authKey: buyData.item.telegramLoginData?.auth_key || null,
          dcId: buyData.item.telegramLoginData?.dc_id || null,
          userId: buyData.item.telegramLoginData?.user_id || buyData.item.telegram_item_id || null,
        }
      }
      
      // If fast-buy didn't return login data, try fetching item details
      if (!loginData?.phoneNumber) {
        const itemRes = await fetch(`${process.env.LZT_API_BASE_URL || 'https://prod-api.lzt.market'}/${itemId}`, {
          headers: { 'Authorization': `Bearer ${LZT_TOKEN}`, 'Accept': 'application/json' }
        })
        if (itemRes.ok) {
          const itemData = await itemRes.json()
          if (itemData?.item) {
            loginData = {
              phoneNumber: itemData.item.telegramLoginData?.phone_number || itemData.item.telegram_phone_number || null,
              authKey: itemData.item.telegramLoginData?.auth_key || null,
              dcId: itemData.item.telegramLoginData?.dc_id || null,
              userId: itemData.item.telegramLoginData?.user_id || itemData.item.telegram_item_id || null,
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch login data:', e)
    }

    try {
      await prisma.purchase.create({
        data: {
          userId: user.id,
          lztItemId: itemId,
          countryName: account.title?.split(' ')[0] || 'Unknown',
          priceUsd: account.price,
          priceInr: costInr,
          phoneNumber: loginData?.phoneNumber ? String(loginData.phoneNumber) : null,
          authKey: loginData?.authKey ? String(loginData.authKey) : null,
          dcId: loginData?.dcId ? String(loginData.dcId) : null,
          tgUserId: loginData?.userId ? String(loginData.userId) : null,
        }
      })
    } catch (e) {
      console.error('Failed to save purchase to DB:', e)
    }

    return NextResponse.json({ 
      success: true, 
      itemId,
      loginData,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
