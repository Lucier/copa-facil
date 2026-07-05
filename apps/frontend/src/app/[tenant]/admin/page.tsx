'use client'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Shield, CalendarDays, BarChart3, TrendingUp, AlertCircle, ClipboardList } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Championship {
  id: string
  name: string
  status: 'active' | 'finished' | 'draft'
}

interface Match {
  id: string
  homeTeamName: string | null
  homeTeamAcronym: string | null
  awayTeamName: string | null
  awayTeamAcronym: string | null
  homeScore: number
  awayScore: number
  scheduledAt: string | null
  status: string
  championshipName?: string
}

interface Registration {
  id: string
  status: string
}

interface Payment {
  id: string
  status: string
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' }> = {
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrada', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'default' },
}

function teamLabel(name: string | null, acronym: string | null) {
  return name ?? acronym ?? 'A definir'
}

export default function DashboardPage() {
  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => (await api.get(API.championships.base)).data,
  })

  const { data: teams = [] } = useQuery<{ id: string }[]>({
    queryKey: ['teams'],
    queryFn: async () => (await api.get(API.teams.base)).data,
  })

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => (await api.get(API.payments.base)).data,
  })

  const championshipIds = championships.map((c) => c.id)

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['dashboard-matches', championshipIds],
    enabled: championshipIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        championships.map(async (c) => {
          const { data } = await api.get(API.championships.matches(c.id))
          return (data as Match[]).map((m) => ({ ...m, championshipName: c.name }))
        }),
      )
      return results.flat()
    },
  })

  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: ['dashboard-registrations', championshipIds],
    enabled: championshipIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        championships.map(async (c) => {
          const { data } = await api.get(`${API.registrations.base}?championshipId=${c.id}`)
          return data as Registration[]
        }),
      )
      return results.flat()
    },
  })

  const activeChampionships = championships.filter((c) => c.status === 'active').length
  const finishedMatches = matches.filter((m) => m.status === 'finished').length
  const pendingRegistrations = registrations.filter((r) => r.status === 'pending').length
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'processing').length

  const stats = [
    { label: 'Campeonatos Ativos', value: activeChampionships, icon: Trophy, highlight: true },
    { label: 'Times Inscritos', value: teams.length, icon: Shield },
    { label: 'Partidas Realizadas', value: finishedMatches, icon: CalendarDays },
    { label: 'Inscrições Pendentes', value: pendingRegistrations, icon: ClipboardList },
  ]

  const recentMatches = [...matches]
    .sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''))
    .slice(0, 5)

  const pendingActions = [
    pendingRegistrations > 0 && {
      id: 'registration',
      label: `${pendingRegistrations} inscriç${pendingRegistrations === 1 ? 'ão aguardando' : 'ões aguardando'} aprovação`,
      icon: AlertCircle,
      urgent: true,
    },
    pendingPayments > 0 && {
      id: 'payment',
      label: `${pendingPayments} pagamento${pendingPayments === 1 ? ' pendente' : 's pendentes'} de confirmação`,
      icon: TrendingUp,
      urgent: false,
    },
  ].filter(Boolean) as { id: string; label: string; icon: typeof AlertCircle; urgent: boolean }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral dos campeonatos e atividades recentes.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Matches */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Partidas Recentes
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                <BarChart3 className="mr-1 size-3" />
                Mais recentes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentMatches.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhuma partida registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confronto</TableHead>
                    <TableHead>Campeonato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMatches.map((m) => {
                    const st = STATUS_MAP[m.status] ?? STATUS_MAP.scheduled
                    const hasScore = m.status === 'live' || m.status === 'finished'
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{teamLabel(m.homeTeamName, m.homeTeamAcronym)}</span>
                            <span className="font-display text-xs font-bold text-muted-foreground">
                              {hasScore ? `${m.homeScore} – ${m.awayScore}` : '—'}
                            </span>
                            <span className="font-medium">{teamLabel(m.awayTeamName, m.awayTeamAcronym)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.championshipName ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.scheduledAt ? formatDateTime(m.scheduledAt) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map((action) => {
              const Icon = action.icon
              return (
                <div
                  key={action.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${action.urgent ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{action.label}</p>
                </div>
              )
            })}
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                {pendingActions.length === 0 ? 'Nenhuma ação pendente' : 'Todas as ações pendentes exibidas'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
