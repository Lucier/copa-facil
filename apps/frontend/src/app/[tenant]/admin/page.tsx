import { Trophy, Shield, Users, CalendarDays, BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'

const STATS = [
  { label: 'Campeonatos Ativos', value: 3, icon: Trophy, trend: 50, highlight: true },
  { label: 'Times Inscritos', value: 24, icon: Shield, trend: 20 },
  { label: 'Jogadores Cadastrados', value: 312, icon: Users, trend: 8 },
  { label: 'Partidas Realizadas', value: 47, icon: CalendarDays, trend: -5 },
]

const RECENT_MATCHES = [
  { id: '1', home: 'Rápidos FC', away: 'Unidos SC', score: '3 – 1', championship: 'Regional 2024', status: 'finished', date: '2026-06-08T20:00:00Z' },
  { id: '2', home: 'Estrela Azul', away: 'Leões do Norte', score: '—', championship: 'Copa Cidade', status: 'live', date: '2026-06-09T19:00:00Z' },
  { id: '3', home: 'Tornado FC', away: 'Sport Clube', score: '—', championship: 'Regional 2024', status: 'scheduled', date: '2026-06-10T20:00:00Z' },
  { id: '4', home: 'Guerreiros', away: 'Falcões EC', score: '1 – 1', championship: 'Copa Cidade', status: 'finished', date: '2026-06-07T19:30:00Z' },
]

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' }> = {
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrada', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'default' },
}

const PENDING_ACTIONS = [
  { id: '1', type: 'registration', label: '4 inscrições aguardando aprovação', icon: AlertCircle, urgent: true },
  { id: '2', type: 'payment', label: '2 pagamentos pendentes de confirmação', icon: TrendingUp, urgent: false },
  { id: '3', type: 'document', label: '7 documentos aguardando revisão', icon: Clock, urgent: false },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral dos campeonatos e atividades recentes.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
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
                Últimas 7 dias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                {RECENT_MATCHES.map((m) => {
                  const st = STATUS_MAP[m.status]
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{m.home}</span>
                          <span className="font-display text-xs font-bold text-muted-foreground">{m.score}</span>
                          <span className="font-medium">{m.away}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.championship}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(m.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
            {PENDING_ACTIONS.map((action) => {
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
              <p className="text-xs text-muted-foreground">Todas as ações pendentes exibidas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
