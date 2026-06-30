import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string; id: string }> }

interface Match {
  id: string; championship_id: string; round_id: string
  home_team_id: string | null; away_team_id: string | null
  status: string; home_score: number; away_score: number
  scheduled_at: string | null
}
interface Standing {
  id: string; team_id: string; points: number; matches_played: number
  wins: number; draws: number; losses: number
  goals_for: number; goals_against: number; goal_difference: number
}
interface Team { id: string; name: string; acronym: string | null }
interface Round { id: string; name: string; number: number }

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'outline' | 'success' | 'live' }> = {
  scheduled: { label: 'Agendado', variant: 'outline' },
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as never },
}

function formatDatetime(dt: string | null) {
  if (!dt) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dt))
}

function TeamName({ id, teams }: { id: string | null; teams: Record<string, Team> }) {
  if (!id) return <span className="text-muted-foreground">A definir</span>
  const t = teams[id]
  return <span>{t?.acronym ?? t?.name ?? id.slice(0, 8)}</span>
}

export default async function ChampionshipHomePage({ params }: Props) {
  const { tenant, id } = await params

  const [matchesRes, standingsRes, teamsRes, roundsRes] = await Promise.allSettled([
    publicFetch<Paginated<Match>>(tenant, 'matches', { championshipId: id, limit: '20' }),
    publicFetch<Paginated<Standing>>(tenant, 'standings', { championshipId: id, limit: '5' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
    publicFetch<Round[]>(tenant, `championships/${id}/rounds`),
  ])

  const allMatches = matchesRes.status === 'fulfilled' ? matchesRes.value.data : []
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value.data : []
  const teams: Record<string, Team> = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )
  const rounds: Record<string, Round> = Object.fromEntries(
    (roundsRes.status === 'fulfilled' ? roundsRes.value : []).map((r) => [r.id, r]),
  )

  const upcoming = allMatches.filter((m) => m.status === 'scheduled').slice(0, 5)
  const recent = allMatches.filter((m) => m.status === 'finished').slice(-5).reverse()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximas Partidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Clock className="size-4" />
              Próximas Partidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma partida agendada.</p>
            ) : upcoming.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <TeamName id={m.home_team_id} teams={teams} />
                    <span className="text-xs text-muted-foreground shrink-0">vs</span>
                    <TeamName id={m.away_team_id} teams={teams} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    <span>{formatDatetime(m.scheduled_at)}</span>
                    {rounds[m.round_id] && <span>· {rounds[m.round_id].name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimos Resultados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Últimos Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum resultado ainda.</p>
            ) : recent.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium truncate"><TeamName id={m.home_team_id} teams={teams} /></span>
                    <span className="font-display font-bold tabular-nums shrink-0 text-base">
                      {m.home_score} – {m.away_score}
                    </span>
                    <span className="font-medium truncate text-right"><TeamName id={m.away_team_id} teams={teams} /></span>
                  </div>
                  {rounds[m.round_id] && (
                    <p className="mt-0.5 text-xs text-muted-foreground text-center">{rounds[m.round_id].name}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick standings */}
      {standings.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Classificação Rápida
            </CardTitle>
            <Link
              href={`/${tenant}/championships/${id}/classificacao`}
              className="text-xs text-primary hover:underline"
            >
              Ver completa →
            </Link>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-2 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">J</th>
                  <th className="px-3 py-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-accent/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2.5 font-medium">
                      {teams[s.team_id]?.acronym ?? teams[s.team_id]?.name ?? s.team_id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-display font-bold text-primary">{s.points}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{s.matches_played}</td>
                    <td className={`px-3 py-2.5 text-center font-medium ${s.goal_difference > 0 ? 'text-emerald-400' : s.goal_difference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
