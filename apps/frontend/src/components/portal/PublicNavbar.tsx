'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '', label: 'Início' },
  { href: '/championships', label: 'Campeonatos' },
  { href: '/teams', label: 'Times' },
  { href: '/matches', label: 'Partidas' },
  { href: '/standings', label: 'Tabela' },
  { href: '/statistics', label: 'Estatísticas' },
  { href: '/news', label: 'Notícias' },
]

export function PublicNavbar({ tenant, orgName }: { tenant: string; orgName: string }) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const base = `/${tenant}`

  const isActive = (href: string) => {
    const full = `${base}${href}`
    if (href === '') return pathname === base
    return pathname.startsWith(full)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={base} className="flex items-center gap-2 shrink-0">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold tracking-tight text-sm">
            {orgName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={`${base}${link.href}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden rounded-md p-2 hover:bg-accent transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/40 bg-background/95 px-4 py-2 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={`${base}${link.href}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
