import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Partidas',
    description: 'Agenda e resultados de partidas.',
    openGraph: { title: 'Partidas — Agenda e Resultados' },
  }
}

interface Match {
  id: string; championship_id: string; round_id: string
  home_team_id: string | null; away_team_id: string | null
  status: string; scheduled_at: string | null
}

interface Team { id: string; name: string; acronym: string | null }
interface Championship { id: string; name: string; season: string }

const STATUS_MAP: Record<string, { label: string; variant: 'live' | 'success' | 'outline' }> = {
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrada', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'outline' },
}

function groupByDate(matches: Match[]) {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) {
    const date = m.scheduled_at ? m.scheduled_at.split('T')[0] : 'sem-data'
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  }
  return groups
}

export default async function MatchesPublicPage({ params }: Props) {
  const { tenant } = await params

  const [matchesRes, teamsRes, champsRes] = await Promise.allSettled([
    publicFetch<Paginated<Match>>(tenant, 'matches', { limit: '100' }),
    publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' }),
    publicFetch<Paginated<Championship>>(tenant, 'championships', { limit: '100' }),
  ])

  const matches = matchesRes.status === 'fulfilled' ? matchesRes.value.data : []
  const teamMap = Object.fromEntries(
    (teamsRes.status === 'fulfilled' ? teamsRes.value.data : []).map((t) => [t.id, t]),
  )
  const champMap = Object.fromEntries(
    (champsRes.status === 'fulfilled' ? champsRes.value.data : []).map((c) => [c.id, c]),
  )

  const grouped = groupByDate(matches)
  const dates = Object.keys(grouped).sort()

  const teamName = (id: string | null) => {
    if (!id) return 'A definir'
    const t = teamMap[id]
    return t ? (t.acronym ?? t.name) : 'Time'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarDays className="size-7 text-primary" />
          Partidas
        </h1>
        <p className="mt-2 text-muted-foreground">Agenda completa e resultados.</p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CalendarDays className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma partida cadastrada ainda.</p>
        </div>
      ) : (
        dates.map((date) => {
          const label = date === 'sem-data'
            ? 'Data a definir'
            : new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })

          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold capitalize text-muted-foreground">{label}</h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <div className="space-y-2">
                {grouped[date].map((m) => {
                  const st = STATUS_MAP[m.status] ?? { label: m.status, variant: 'outline' as const }
                  const champ = champMap[m.championship_id]
                  const time = m.scheduled_at ? m.scheduled_at.split('T')[1]?.slice(0, 5) : null

                  return (
                    <Link key={m.id} href={`/${tenant}/matches/${m.id}`}>
                      <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="hidden sm:block w-36 shrink-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
                              {champ ? `${champ.name} ${champ.season}` : '—'}
                            </p>
                          </div>

                          <div className="flex flex-1 items-center justify-center gap-3">
                            <span className="flex-1 text-right text-sm font-semibold group-hover:text-primary/80 transition-colors">
                              {teamName(m.home_team_id)}
                            </span>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span className="font-display text-sm font-bold">{time ?? '—:—'}</span>
                            </div>
                            <span className="flex-1 text-left text-sm font-semibold group-hover:text-primary/80 transition-colors">
                              {teamName(m.away_team_id)}
                            </span>
                          </div>

                          <Badge variant={st.variant} className="shrink-0">{st.label}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
