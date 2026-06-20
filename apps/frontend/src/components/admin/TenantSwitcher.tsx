'use client'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronDown, Building2, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { getInitials } from '@/lib/utils'

export function TenantSwitcher() {
  const params = useParams()
  const router = useRouter()
  const currentTenant = (params.tenant as string) ?? ''
  const user = useAuthStore((s) => s.user)

  const tenants: { slug: string; name: string }[] = (user as any)?.organizations ?? []

  const currentOrg = tenants.find((t) => t.slug === currentTenant)
  const displayName = currentOrg?.name ?? currentTenant

  if (!tenants.length) {
    return (
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-primary font-display text-xs font-bold">
          {getInitials(displayName)}
        </div>
        <span className="truncate text-sm font-semibold">{displayName}</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-primary">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary font-display text-xs font-bold">
            {getInitials(displayName)}
          </div>
          <span className="flex-1 truncate text-sm font-semibold leading-tight">{displayName}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-3.5" />
          Organizações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.slug}
            onClick={() => router.push(`/${t.slug}/admin`)}
            className={cn('gap-2', t.slug === currentTenant && 'bg-accent')}
          >
            <div className="flex size-6 items-center justify-center rounded bg-primary/15 text-primary font-display text-[10px] font-bold">
              {getInitials(t.name)}
            </div>
            <span className="flex-1 truncate">{t.name}</span>
            {t.slug === currentTenant && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
