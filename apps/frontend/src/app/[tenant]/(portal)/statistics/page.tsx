import type { Metadata } from 'next'
import { BarChart3, Target, Star, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'

// SSR — leaderboards reflect latest match data
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Estatísticas',
    description: 'Artilharia, assistências e tabela fair play dos campeonatos.',
    openGraph: { title: 'Estatísticas — Artilharia e Assistências' },
  }
}

const TOP_SCORERS = [
  { rank: 1, name: 'Carlos Mendes', team: 'Rápidos FC', goals: 12, assists: 5, apps: 8 },
  { rank: 2, name: 'Fernando Alves', team: 'Leões do Norte', goals: 9, assists: 3, apps: 8 },
  { rank: 3, name: 'Rafael Costa', team: 'Unidos SC', goals: 7, assists: 11, apps: 8 },
  { rank: 4, name: 'Pedro Rocha', team: 'Estrela Azul', goals: 6, assists: 4, apps: 7 },
  { rank: 5, name: 'Matheus Rocha', team: 'Tornado FC', goals: 4, assists: 8, apps: 8 },
  { rank: 6, name: 'Anderson Lima', team: 'Sport Clube', goals: 4, assists: 2, apps: 8 },
  { rank: 7, name: 'Lucas Santana', team: 'Estrela Azul', goals: 3, assists: 6, apps: 7 },
  { rank: 8, name: 'Rafael Lima', team: 'Rápidos FC', goals: 3, assists: 4, apps: 8 },
]

const TOP_ASSISTS = [
  { rank: 1, name: 'Rafael Costa', team: 'Unidos SC', goals: 7, assists: 11, apps: 8 },
  { rank: 2, name: 'Matheus Rocha', team: 'Tornado FC', goals: 4, assists: 8, apps: 8 },
  { rank: 3, name: 'Lucas Santana', team: 'Estrela Azul', goals: 3, assists: 6, apps: 7 },
  { rank: 4, name: 'Carlos Mendes', team: 'Rápidos FC', goals: 12, assists: 5, apps: 8 },
  { rank: 5, name: 'Rafael Lima', team: 'Rápidos FC', goals: 3, assists: 4, apps: 8 },
]

const FAIR_PLAY = [
  { rank: 1, team: 'Rápidos FC', yellow: 6, red: 0, pts: 6 },
  { rank: 2, team: 'Tornado FC', yellow: 8, red: 0, pts: 8 },
  { rank: 3, team: 'Estrela Azul', yellow: 9, red: 0, pts: 9 },
  { rank: 4, team: 'Unidos SC', yellow: 10, red: 1, pts: 13 },
  { rank: 5, name: 'Leões do Norte', yellow: 11, red: 1, pts: 14 },
  { rank: 6, team: 'Guerreiros', yellow: 12, red: 2, pts: 18 },
]

function PlayerRow({ player, metric }: { player: typeof TOP_SCORERS[0]; metric: 'goals' | 'assists' }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50">
      <span className={`w-6 text-center text-sm font-bold font-display ${player.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
        {player.rank}
      </span>
      <Avatar className="size-8">
        <AvatarFallback className="text-[10px]">{getInitials(player.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{player.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{player.team}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-xl font-bold text-primary">{player[metric]}</p>
        <p className="text-[10px] text-muted-foreground">{player.apps} jog</p>
      </div>
    </div>
  )
}

export default async function StatisticsPublicPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="size-7 text-primary" />
          Estatísticas
        </h1>
        <p className="mt-2 text-muted-foreground">Artilharia, assistências e fair play atualizados em tempo real.</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Gols Marcados', value: '85', icon: Target },
          { label: 'Artilheiro', value: 'C. Mendes', icon: Target },
          { label: 'Assistências', value: '41', icon: Star },
          { label: 'Menos Cartões', value: 'Rápidos FC', icon: Shield },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="size-7 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-display font-bold truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Scorers */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Target className="size-4 text-primary" />
              Artilharia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {TOP_SCORERS.map((p) => <PlayerRow key={p.name} player={p} metric="goals" />)}
          </CardContent>
        </Card>

        {/* Top Assists */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Star className="size-4 text-primary" />
              Assistências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {TOP_ASSISTS.map((p) => <PlayerRow key={p.name} player={p} metric="assists" />)}
          </CardContent>
        </Card>

        {/* Fair Play */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Shield className="size-4 text-primary" />
              Fair Play (menos pontos = melhor)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {FAIR_PLAY.map((row) => (
              <div key={row.rank} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <span className={`w-6 text-center text-sm font-bold font-display ${row.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {row.rank}
                </span>
                <span className="flex-1 text-sm font-medium">{(row as any).team ?? (row as any).name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="warning" className="gap-1">{row.yellow} CA</Badge>
                  {row.red > 0 && <Badge variant="destructive" className="gap-1">{row.red} CV</Badge>}
                </div>
                <span className="font-display font-bold text-sm">{row.pts}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
