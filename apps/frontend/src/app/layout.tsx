import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Syne, DM_Sans } from 'next/font/google'
import { Providers } from '@/components/admin/Providers'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Copa Fácil', template: '%s — Copa Fácil' },
  description: 'Gestão simplificada de campeonatos esportivos',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nonce is generated per-request in middleware and forwarded via x-nonce header.
  // Pass it to any <Script nonce={nonce}> components to satisfy the CSP.
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-sans antialiased`} data-nonce={nonce}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
