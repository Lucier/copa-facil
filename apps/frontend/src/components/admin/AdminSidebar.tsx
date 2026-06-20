'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Trophy, Shield, Users, CalendarDays,
  BarChart3, FileText, Settings, ChevronLeft, Zap, ClipboardList, Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { TenantSwitcher } from './TenantSwitcher'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '', icon: LayoutDashboard },
  { label: 'Campeonatos', href: '/championships', icon: Trophy },
  { label: 'Times', href: '/teams', icon: Shield },
  { label: 'Jogadores', href: '/players', icon: Users },
  { label: 'Partidas', href: '/matches', icon: CalendarDays },
  { label: 'Inscrições', href: '/registrations', icon: ClipboardList },
  { label: 'Pagamentos', href: '/payments', icon: Wallet },
  { label: 'Estatísticas', href: '/statistics', icon: BarChart3 },
  { label: 'CMS', href: '/cms', icon: FileText },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Configurações', href: '/settings', icon: Settings },
]

interface AdminSidebarProps {
  tenant: string
}

export function AdminSidebar({ tenant }: AdminSidebarProps) {
  const pathname = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const base = `/${tenant}/admin`

  const isActive = (href: string) => {
    const full = `${base}${href}`
    if (href === '') return pathname === base
    return pathname.startsWith(full)
  }

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-display text-sm font-bold tracking-tight">
            Copa<span className="text-primary">Fácil</span>
          </span>
        )}
      </div>

      {/* Tenant Switcher */}
      {!collapsed && (
        <div className="border-b border-sidebar-border px-2 py-2">
          <TenantSwitcher />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} base={base} active={isActive(item.href)} collapsed={collapsed} />
            </li>
          ))}
        </ul>

        <Separator className="my-3 bg-sidebar-border" />

        <ul className="space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} base={base} active={isActive(item.href)} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-[54px] z-10 flex size-6 items-center justify-center rounded-full',
          'border border-border bg-background text-muted-foreground shadow-sm',
          'hover:border-primary/50 hover:text-primary transition-colors',
          'opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200',
        )}
      >
        <ChevronLeft className={cn('size-3.5 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  )
}

function NavLink({
  item,
  base,
  active,
  collapsed,
}: {
  item: NavItem
  base: string
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={`${base}${item.href}`}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {active && !collapsed && (
        <span className="ml-auto size-1 shrink-0 rounded-full bg-primary" />
      )}
    </Link>
  )
}
