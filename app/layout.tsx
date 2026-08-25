import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { TmaProvider } from '@/components/TmaProvider'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TGAccounts — Telegram Account Finder',
  description: 'Find verified Telegram accounts with powerful filters. Search by country, price, premium status, channels, stars and more.',
  keywords: ['telegram accounts', 'buy telegram account', 'telegram premium accounts'],
  openGraph: {
    title: 'TGAccounts — Telegram Account Finder',
    description: 'Search and filter thousands of Telegram accounts instantly.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={`${geist.className} bg-[#0a0a0f] text-white min-h-screen antialiased`}>
        <TmaProvider>
          {children}
        </TmaProvider>
      </body>
    </html>
  )
}
