import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Clock, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params
  const name = tenant.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${name} — Portal Oficial`,
    openGraph: { title: `${name} — Portal Oficial de Campeonatos` },
  }
}

interface Match {
  id: string; championship_id: string; home_team_id: string | null
  away_team_id: string | null; status: string; scheduled_at: string | null
}
interface Team { id: string; name: string; acronym: string | null; primary_color: string | null }
interface Championship { id: string; name: string; season: string }
interface Standing {
  id: string; championship_id: string; team_id: string
  points: number; matches_played: number; wins: number; draws: number; losses: number
  goal_difference: number
}

export default async function PublicHomePage({ params }: Props) {
  const { tenant } = await params

  const [matchesRes, teamsRes, champsRes, standingsRes] = await Promise.allSettled([
    publicFetch<Paginated<Match>>(tenant, 'matches', { limit: '20' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
    publicFetch<Paginated<Championship>>(tenant, 'championships', { limit: '20' }),
    publicFetch<Paginated<Standing>>(tenant, 'standings', { limit: '10' }),
  ])

  const allMatches = matchesRes.status === 'fulfilled' ? matchesRes.value.data : []
  const teamMap = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )
  const champMap = Object.fromEntries(
    (champsRes.status === 'fulfilled' ? champsRes.value.data : []).map((c) => [c.id, c]),
  )
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value.data : []

  const liveMatches = allMatches.filter((m) => m.status === 'live')
  const upcomingMatches = allMatches.filter((m) => m.status === 'scheduled').slice(0, 3)

  const teamName = (id: string | null) =>
    id ? (teamMap[id]?.name ?? 'Time') : 'A definir'

  const firstChampId = standings[0]?.championship_id
  const firstChamp = firstChampId ? champMap[firstChampId] : null

  return (
    <div className="space-y-0">
      {/* Live banner */}
      {liveMatches.length > 0 && (
        <div className="border-b border-primary/30 bg-primary/8 py-2">
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4">
            <Badge variant="live" className="shrink-0 gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              AO VIVO
            </Badge>
            {liveMatches.map((m) => (
              <Link
                key={m.id}
                href={`/${tenant}/matches/${m.id}`}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <span>{teamName(m.home_team_id)}</span>
                <span className="font-display font-bold text-primary">vs</span>
                <span>{teamName(m.away_team_id)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            {/* Welcome */}
            <div className="space-y-4 flex flex-col justify-center">
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
                Bem-vindo ao portal{' '}
                <span className="text-primary">
                  {tenant.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Acompanhe campeonatos, partidas, classificação e estatísticas em tempo real.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/${tenant}/championships`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Ver campeonatos <ChevronRight className="size-4" />
                </Link>
                <Link
                  href={`/${tenant}/teams`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Ver times <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Standings preview */}
            {standings.length > 0 && (
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {firstChamp ? `${firstChamp.name} ${firstChamp.season}` : 'Classificação'}
                    </span>
                  </div>
                  <Link href={`/${tenant}/standings`} className="text-xs text-primary hover:underline">
                    Ver completa
                  </Link>
                </div>
                <div className="space-y-1">
                  {standings
                    .filter((s) => s.championship_id === firstChampId)
                    .slice(0, 5)
                    .map((row, idx) => {
                      const team = teamMap[row.team_id]
                      return (
                        <div key={row.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors">
                          <span className={`w-5 text-center text-[11px] font-bold ${idx < 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {idx + 1}
                          </span>
                          <span className="flex-1 font-medium">{team?.name ?? '—'}</span>
                          <span className="text-xs text-muted-foreground">{row.matches_played} jg</span>
                          <span className="w-7 text-right font-display font-bold text-sm">{row.points}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                Próximas Partidas
              </h2>
              <Link href={`/${tenant}/matches`} className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver agenda <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingMatches.map((m) => {
                const champ = champMap[m.championship_id]
                return (
                  <Link key={m.id} href={`/${tenant}/matches/${m.id}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
                            {champ ? `${champ.name} ${champ.season}` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex-1 text-sm font-semibold text-right">{teamName(m.home_team_id)}</span>
                          <span className="font-display text-xs font-bold text-muted-foreground px-2">VS</span>
                          <span className="flex-1 text-sm font-semibold">{teamName(m.away_team_id)}</span>
                        </div>
                        {m.scheduled_at && (
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {formatDateTime(m.scheduled_at)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no data at all */}
      {upcomingMatches.length === 0 && liveMatches.length === 0 && standings.length === 0 && (
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 text-center space-y-3">
            <Trophy className="mx-auto size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma partida ou classificação disponível ainda.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href={`/${tenant}/teams`} className="text-sm text-primary hover:underline">Ver times</Link>
              <Link href={`/${tenant}/championships`} className="text-sm text-primary hover:underline">Ver campeonatos</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
