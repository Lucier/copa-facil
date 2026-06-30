import type { Metadata } from 'next'
import { BarChart3, Target, Handshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Ranking' }

interface Props { params: Promise<{ tenant: string; id: string }> }

interface StatRow {
  id: string; player_id: string; team_id: string
  goals: number; assists: number; yellow_cards: number; red_cards: number
}
interface Player { id: string; fullName: string; photoUrl: string | null }
interface Team { id: string; name: string; acronym: string | null }

type LeaderType = 'goals' | 'assists'

async function fetchLeaderboard(tenant: string, championshipId: string, type: LeaderType) {
  try {
    const res = await publicFetch<Paginated<StatRow>>(tenant, 'statistics/leaderboard', {
      championshipId,
      type,
      limit: '20',
    })
    return res.data
  } catch {
    return []
  }
}

async function fetchPlayers(tenant: string): Promise<Record<string, Player>> {
  try {
    const res = await publicFetch<Paginated<Player>>(tenant, 'players', { limit: '200' })
    return Object.fromEntries(res.data.map((p) => [p.id, p]))
  } catch {
    return {}
  }
}

async function fetchTeams(tenant: string): Promise<Record<string, Team>> {
  try {
    const res = await publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' })
    return Object.fromEntries(res.data.map((t) => [t.id, t]))
  } catch {
    return {}
  }
}

interface RankingTableProps {
  rows: StatRow[]
  players: Record<string, Player>
  teams: Record<string, Team>
  valueKey: 'goals' | 'assists'
  valueLabel: string
}

function RankingTable({ rows, players, teams, valueKey, valueLabel }: RankingTableProps) {
  const filtered = rows.filter((r) => r[valueKey] > 0)
  if (filtered.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem dados disponíveis.</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border/40 text-xs text-muted-foreground">
          <th className="px-4 py-2 text-left w-8">#</th>
          <th className="px-2 py-2 text-left">Jogador</th>
          <th className="px-2 py-2 text-left">Time</th>
          <th className="px-4 py-2 text-center font-semibold">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((r, i) => {
          const player = players[r.player_id]
          const team = teams[r.team_id]
          return (
            <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-accent/20">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
              <td className="px-2 py-2.5 font-medium">{player?.fullName ?? r.player_id.slice(0, 8)}</td>
              <td className="px-2 py-2.5 text-xs text-muted-foreground">
                {team?.acronym ?? team?.name ?? '—'}
              </td>
              <td className="px-4 py-2.5 text-center font-display font-bold text-primary text-base">
                {r[valueKey]}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default async function RankingPage({ params }: Props) {
  const { tenant, id } = await params

  const [scorers, assisters, players, teams] = await Promise.all([
    fetchLeaderboard(tenant, id, 'goals'),
    fetchLeaderboard(tenant, id, 'assists'),
    fetchPlayers(tenant),
    fetchTeams(tenant),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Artilharia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Target className="size-4 text-primary" />
              Artilharia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <RankingTable
              rows={scorers}
              players={players}
              teams={teams}
              valueKey="goals"
              valueLabel="Gols"
            />
          </CardContent>
        </Card>

        {/* Assistências */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Handshake className="size-4 text-primary" />
              Assistências
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <RankingTable
              rows={assisters}
              players={players}
              teams={teams}
              valueKey="assists"
              valueLabel="Assists"
            />
          </CardContent>
        </Card>
      </div>

      {scorers.length === 0 && assisters.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <BarChart3 className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma estatística disponível ainda.</p>
          <p className="text-xs text-muted-foreground">Os rankings serão atualizados conforme as partidas forem registradas.</p>
        </div>
      )}
    </div>
  )
}
