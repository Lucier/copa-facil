import type { Metadata } from 'next'
import { BarChart3, Target, Star, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Estatísticas',
    description: 'Artilharia, assistências e fair play dos campeonatos.',
    openGraph: { title: 'Estatísticas — Artilharia e Assistências' },
  }
}

interface StatRow {
  id: string; championship_id: string; team_id: string; player_id: string
  goals: number; assists: number; yellow_cards: number; red_cards: number
  fair_play_points: number
}

interface Player { id: string; full_name: string; main_position: string }
interface Team { id: string; name: string; acronym: string | null }

function PlayerRow({
  rank, stat, playerMap, teamMap, metric,
}: {
  rank: number
  stat: StatRow
  playerMap: Record<string, Player>
  teamMap: Record<string, Team>
  metric: 'goals' | 'assists'
}) {
  const player = playerMap[stat.player_id]
  const team = teamMap[stat.team_id]
  const name = player?.full_name ?? 'Jogador'
  const teamName = team?.acronym ?? team?.name ?? '—'

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50">
      <span className={`w-6 text-center text-sm font-bold font-display ${rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
        {rank}
      </span>
      <Avatar className="size-8">
        <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{teamName}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-xl font-bold text-primary">{stat[metric]}</p>
      </div>
    </div>
  )
}

export default async function StatisticsPublicPage({ params }: Props) {
  const { tenant } = await params

  const [goalsRes, assistsRes, fairPlayRes, playersRes, teamsRes] = await Promise.allSettled([
    publicFetch<Paginated<StatRow>>(tenant, 'statistics/leaderboard', { type: 'goals', limit: '10' }),
    publicFetch<Paginated<StatRow>>(tenant, 'statistics/leaderboard', { type: 'assists', limit: '10' }),
    publicFetch<Paginated<StatRow>>(tenant, 'statistics/leaderboard', { type: 'fair_play', limit: '10' }),
    publicFetch<Paginated<Player>>(tenant, 'players', { limit: '100' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
  ])

  const topScorers = goalsRes.status === 'fulfilled' ? goalsRes.value.data : []
  const topAssists = assistsRes.status === 'fulfilled' ? assistsRes.value.data : []
  const fairPlay = fairPlayRes.status === 'fulfilled' ? fairPlayRes.value.data : []

  const playerMap = Object.fromEntries(
    (playersRes.status === 'fulfilled' ? playersRes.value.data : []).map((p) => [p.id, p]),
  )
  const teamMap = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )

  const totalGoals = topScorers.reduce((s, r) => s + r.goals, 0)
  const topScorer = topScorers[0] ? playerMap[topScorers[0].player_id]?.full_name?.split(' ')[0] : '—'
  const topAssist = topAssists[0] ? playerMap[topAssists[0].player_id]?.full_name?.split(' ')[0] : '—'
  const fairPlayTeam = fairPlay[0] ? (teamMap[fairPlay[0].team_id]?.name ?? '—') : '—'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="size-7 text-primary" />
          Estatísticas
        </h1>
        <p className="mt-2 text-muted-foreground">Artilharia, assistências e fair play atualizados em tempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Gols Marcados', value: String(totalGoals), icon: Target },
          { label: 'Artilheiro', value: topScorer, icon: Target },
          { label: 'Mais Assistências', value: topAssist, icon: Star },
          { label: 'Menos Cartões', value: fairPlayTeam, icon: Shield },
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Target className="size-4 text-primary" />
              Artilharia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {topScorers.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : topScorers.map((s, i) => (
              <PlayerRow key={s.id} rank={i + 1} stat={s} playerMap={playerMap} teamMap={teamMap} metric="goals" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Star className="size-4 text-primary" />
              Assistências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {topAssists.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : topAssists.map((s, i) => (
              <PlayerRow key={s.id} rank={i + 1} stat={s} playerMap={playerMap} teamMap={teamMap} metric="assists" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Shield className="size-4 text-primary" />
              Fair Play
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {fairPlay.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : fairPlay.map((row, i) => {
              const team = teamMap[row.team_id]
              return (
                <div key={row.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors">
                  <span className={`w-6 text-center text-sm font-bold font-display ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{team?.name ?? '—'}</span>
                  <div className="flex items-center gap-2 text-xs">
                    {row.yellow_cards > 0 && <Badge variant="warning">{row.yellow_cards} CA</Badge>}
                    {row.red_cards > 0 && <Badge variant="destructive">{row.red_cards} CV</Badge>}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
