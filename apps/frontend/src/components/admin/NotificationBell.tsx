'use client'
import * as React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Nova inscrição', body: 'Time FC Rápidos solicitou inscrição no Campeonato Regional.', read: false, createdAt: '2 min atrás' },
  { id: '2', title: 'Pagamento confirmado', body: 'Transação #TXN-4821 aprovada — R$ 250,00.', read: false, createdAt: '18 min atrás' },
  { id: '3', title: 'Partida encerrada', body: 'Rápidos FC 3 × 1 Unidos SC registrada com sucesso.', read: true, createdAt: '1h atrás' },
]

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS)
  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-[7px] items-center justify-center rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notificações {unread > 0 && <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">{unread}</span>}
          </DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Marcar lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent cursor-pointer',
                  !n.read && 'bg-primary/5',
                )}
              >
                {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                {n.read && <span className="mt-1.5 size-1.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs font-semibold', !n.read ? 'text-foreground' : 'text-muted-foreground')}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">{n.createdAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
