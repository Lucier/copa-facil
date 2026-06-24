'use client'
import * as React from 'react'
import { usePathname, useParams } from 'next/navigation'
import { ChevronRight, LogOut, User, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { useRouter } from 'next/navigation'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  championships: 'Campeonatos',
  teams: 'Times',
  players: 'Jogadores',
  matches: 'Partidas',
  statistics: 'Estatísticas',
  cms: 'CMS',
  settings: 'Configurações',
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const params = useParams()
  const tenant = params.tenant as string

  const segments = pathname.split('/').filter(Boolean)
  const tenantIndex = segments.indexOf(tenant)
  const afterTenant = segments.slice(tenantIndex + 1)

  return afterTenant.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    href: '/' + segments.slice(0, tenantIndex + 1 + i + 1).join('/'),
    isLast: i === afterTenant.length - 1,
  }))
}

export function AdminHeader() {
  const breadcrumbs = useBreadcrumbs()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const router = useRouter()
  const params = useParams()
  const tenant = params.tenant as string

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

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
