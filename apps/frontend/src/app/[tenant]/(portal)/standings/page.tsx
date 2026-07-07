import type { Metadata } from 'next'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Tabela de Classificação',
    description: 'Classificação atualizada dos campeonatos.',
    openGraph: { title: 'Tabela de Classificação' },
  }
}

interface Standing {
  id: string; championship_id: string; group_id: string | null; team_id: string
  matches_played: number; wins: number; draws: number; losses: number
  goals_for: number; goals_against: number; goal_difference: number; points: number
  yellow_cards: number; red_cards: number; fair_play_points: number
}

interface Team { id: string; name: string; acronym: string | null }
interface Championship { id: string; name: string; season: string; status: string }

const FORM_COLORS: Record<string, string> = {
  V: 'bg-emerald-500/20 text-emerald-400',
  E: 'bg-amber-500/20 text-amber-400',
  D: 'bg-red-500/20 text-red-400',
}

function StandingsTable({ rows, teamMap }: { rows: Standing[]; teamMap: Record<string, Team> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-center">Pts</TableHead>
          <TableHead className="text-center">PJ</TableHead>
          <TableHead className="text-center">V</TableHead>
          <TableHead className="text-center">E</TableHead>
          <TableHead className="text-center">D</TableHead>
          <TableHead className="text-center">GP</TableHead>
          <TableHead className="text-center">GC</TableHead>
          <TableHead className="text-center">SG</TableHead>
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
                {team ? (team.acronym ?? team.name) : row.team_id.slice(0, 8)}
              </TableCell>
              <TableCell className="text-center font-display font-bold">{row.points}</TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.matches_played}</TableCell>
              <TableCell className="text-center text-sm text-emerald-400">{row.wins}</TableCell>
              <TableCell className="text-center text-sm text-amber-400">{row.draws}</TableCell>
              <TableCell className="text-center text-sm text-red-400">{row.losses}</TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.goals_for}</TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">{row.goals_against}</TableCell>
              <TableCell className={`text-center text-sm font-semibold ${row.goal_difference > 0 ? 'text-emerald-400' : row.goal_difference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default async function StandingsPage({ params }: Props) {
  const { tenant } = await params

  const [standingsRes, teamsRes, champsRes] = await Promise.allSettled([
    publicFetch<Paginated<Standing>>(tenant, 'standings', { limit: '100' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
    publicFetch<Paginated<Championship>>(tenant, 'championships', { limit: '50' }),
  ])

  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value.data : []
  const teamMap = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )
  const championships = champsRes.status === 'fulfilled' ? champsRes.value.data : []

  // Group standings by championship
  const byChamp: Record<string, Standing[]> = {}
  for (const s of standings) {
    if (!byChamp[s.championship_id]) byChamp[s.championship_id] = []
    byChamp[s.championship_id].push(s)
  }

  const champIds = Object.keys(byChamp)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="size-7 text-primary" />
          Tabela de Classificação
        </h1>
        <p className="mt-2 text-muted-foreground">Classificação atualizada após cada rodada.</p>
      </div>

      {champIds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Trophy className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma classificação disponível ainda.</p>
        </div>
      ) : (
        champIds.map((champId) => {
          const champ = championships.find((c) => c.id === champId)
          const rows = byChamp[champId]

          // Group by group_id within championship
          const groups: Record<string, Standing[]> = {}
          for (const s of rows) {
            const key = s.group_id ?? '__no_group__'
            if (!groups[key]) groups[key] = []
            groups[key].push(s)
          }
          const groupKeys = Object.keys(groups)

          return (
            <div key={champId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">
                  {champ ? `${champ.name} ${champ.season}` : 'Campeonato'}
                </h2>
                {champ && (
                  <Badge variant={champ.status === 'active' ? 'success' : champ.status === 'finished' ? 'default' : 'outline'}>
                    {champ.status === 'active' ? 'Em Andamento' : champ.status === 'finished' ? 'Encerrado' : 'Em breve'}
                  </Badge>
                )}
              </div>

              {groupKeys.length === 1 && groupKeys[0] === '__no_group__' ? (
                <Card>
                  <CardContent className="p-0 pb-1">
                    <StandingsTable rows={groups['__no_group__']} teamMap={teamMap} />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {groupKeys.map((gKey) => (
                    <Card key={gKey}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                          {gKey === '__no_group__' ? 'Geral' : 'Grupo'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 pb-1">
                        <StandingsTable rows={groups[gKey]} teamMap={teamMap} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary/20" />
          Classifica para próxima fase
        </div>
        {Object.entries(FORM_COLORS).map(([k, v]) => (
          <span key={k} className={`inline-flex size-5 items-center justify-center rounded text-[9px] font-bold ${v}`}>{k}</span>
        ))}
      </div>
    </div>
  )
}
