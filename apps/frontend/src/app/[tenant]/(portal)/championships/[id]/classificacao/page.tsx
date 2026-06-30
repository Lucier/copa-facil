import type { Metadata } from 'next'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Classificação' }

interface Props { params: Promise<{ tenant: string; id: string }> }

interface Standing {
  id: string; championship_id: string; group_id: string | null; team_id: string
  matches_played: number; wins: number; draws: number; losses: number
  goals_for: number; goals_against: number; goal_difference: number
  points: number; yellow_cards: number; red_cards: number
  fair_play_points: number; extra_points: number
}
interface Team { id: string; name: string; acronym: string | null }

function aproveitamento(points: number, played: number): string {
  if (played === 0) return '0.0'
  return ((points / (played * 3)) * 100).toFixed(1)
}

function StandingsTable({ rows, teamMap }: { rows: Standing[]; teamMap: Record<string, Team> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-xs">
          <TableHead className="w-8">#</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-center font-bold text-primary">P</TableHead>
          <TableHead className="text-center">J</TableHead>
          <TableHead className="text-center">V</TableHead>
          <TableHead className="text-center">E</TableHead>
          <TableHead className="text-center">D</TableHead>
          <TableHead className="text-center">GP</TableHead>
          <TableHead className="text-center">GC</TableHead>
          <TableHead className="text-center">SG</TableHead>
          <TableHead className="text-center">%</TableHead>
          <TableHead className="text-center">PE</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => {
          const team = teamMap[row.team_id]
          const pos = idx + 1
          return (
            <TableRow key={row.id}>
              <TableCell>
                <span className={`inline-flex size-6 items-center justify-center rounded text-[11px] font-bold
                  ${pos <= 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                  {pos}
                </span>
              </TableCell>
              <TableCell className="font-medium text-sm">
                {team ? (team.name) : row.team_id.slice(0, 8)}
              </TableCell>
              <TableCell className="text-center font-display text-base font-bold text-primary">
                {row.points}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.matches_played}</TableCell>
              <TableCell className="text-center text-sm text-emerald-400">{row.wins}</TableCell>
              <TableCell className="text-center text-sm text-amber-400">{row.draws}</TableCell>
              <TableCell className="text-center text-sm text-red-400">{row.losses}</TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.goals_for}</TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.goals_against}</TableCell>
              <TableCell className={`text-center text-sm font-semibold
                ${row.goal_difference > 0 ? 'text-emerald-400' : row.goal_difference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {aproveitamento(row.points, row.matches_played)}%
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {row.extra_points !== 0
                  ? <span className={row.extra_points > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {row.extra_points > 0 ? '+' : ''}{row.extra_points}
                    </span>
                  : '—'
                }
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default async function ClassificacaoPage({ params }: Props) {
  const { tenant, id } = await params

  const [standingsRes, teamsRes] = await Promise.allSettled([
    publicFetch<Paginated<Standing>>(tenant, 'standings', { championshipId: id, limit: '100' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
  ])

  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value.data : []
  const teamMap: Record<string, Team> = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Trophy className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma classificação disponível ainda.</p>
        <p className="text-xs text-muted-foreground">A tabela será atualizada conforme as partidas forem realizadas.</p>
      </div>
    )
  }

  // Group by group_id
  const groups: Record<string, Standing[]> = {}
  for (const s of standings) {
    const key = s.group_id ?? '__no_group__'
    ;(groups[key] ??= []).push(s)
  }
  const groupKeys = Object.keys(groups)

  return (
    <div className="space-y-6">
      {groupKeys.length === 1 && groupKeys[0] === '__no_group__' ? (
        <Card>
          <CardContent className="p-0 pb-1">
            <StandingsTable rows={groups['__no_group__']} teamMap={teamMap} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupKeys.map((gKey) => (
            <Card key={gKey}>
              {gKey !== '__no_group__' && (
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Grupo
                  </CardTitle>
                </CardHeader>
              )}
              <CardContent className="p-0 pb-1">
                <StandingsTable rows={groups[gKey]} teamMap={teamMap} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p><strong>P</strong> = Pontos · <strong>J</strong> = Jogos · <strong>V</strong> = Vitórias · <strong>E</strong> = Empates · <strong>D</strong> = Derrotas</p>
        <p><strong>GP</strong> = Gols Pró · <strong>GC</strong> = Gols Contra · <strong>SG</strong> = Saldo de Gols · <strong>%</strong> = Aproveitamento</p>
        <p><strong>PE</strong> = Penalidades / Pontos Extras (bônus ou punições aplicadas pela organização)</p>
      </div>
    </div>
  )
}
