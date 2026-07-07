'use client'
import * as React from 'react'
import { usePathname, useParams } from 'next/navigation'
import { ChevronRight, LogOut, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '@/store/useAuthStore'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  championships: 'Campeonatos',
  teams: 'Times',
  players: 'Jogadores',
  matches: 'Partidas',
  statistics: 'Estatísticas',
  cms: 'CMS',
  settings: 'Configurações',
  estrutura: 'Estrutura',
  classificacao: 'Classificação',
  ranking: 'Ranking',
  report: 'Relatório',
  sumula: 'Súmula',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function useBreadcrumbs(championshipNames: Record<string, string>) {
  const pathname = usePathname()
  const params = useParams()
  const tenant = params.tenant as string

  const segments = pathname.split('/').filter(Boolean)
  const tenantIndex = segments.indexOf(tenant)
  const afterTenant = segments.slice(tenantIndex + 1)

  return afterTenant.map((seg, i) => {
    let label = SEGMENT_LABELS[seg] ?? seg
    if (UUID_RE.test(seg) && championshipNames[seg]) {
      label = championshipNames[seg]
    }
    return {
      label,
      href: '/' + segments.slice(0, tenantIndex + 1 + i + 1).join('/'),
      isLast: i === afterTenant.length - 1,
    }
  })
}

export function AdminHeader() {
  const pathname = usePathname()
  const hasChampionshipId = UUID_RE.test(pathname.split('/').find((s) => UUID_RE.test(s)) ?? '')

  const { data: championships = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['championships'],
    queryFn: async () => { const { data } = await api.get(API.championships.base); return data },
    enabled: hasChampionshipId,
    staleTime: 60_000,
  })

  const championshipNames = React.useMemo(
    () => Object.fromEntries(championships.map((c) => [c.id, c.name])),
    [championships],
  )

  const breadcrumbs = useBreadcrumbs(championshipNames)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  async function handleLogout() {
    try {
      await api.post(API.auth.logout)
    } catch {
      // ignore — cookie will expire naturally
    }
    clearAuth()
    window.location.href = '/'
  }

  const displayName = user?.name ?? 'Usuário'
  const email = user?.email ?? ''

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
            <span
              className={
                crumb.isLast
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              }
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-7">
                <AvatarFallback className="text-[11px]">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <User className="size-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
