import type { Metadata } from 'next'
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
  title: { default: 'Cerrados Esportes', template: '%s — Cerrados Esportes' },
  description: 'Gestão simplificada de campeonatos esportivos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
