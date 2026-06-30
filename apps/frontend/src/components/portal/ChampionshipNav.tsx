'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, ListOrdered } from 'lucide-react'

interface Props { base: string }

export function ChampionshipNav({ base }: Props) {
  const pathname = usePathname()

  const links = [
    { href: base, label: 'Início', icon: Home },
    { href: `${base}/classificacao`, label: 'Classificação', icon: BarChart3 },
    { href: `${base}/ranking`, label: 'Ranking', icon: ListOrdered },
  ]

  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex gap-1 border-b border-border/50">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors hover:text-foreground
              ${active
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-primary'
                : 'text-muted-foreground'
              }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
