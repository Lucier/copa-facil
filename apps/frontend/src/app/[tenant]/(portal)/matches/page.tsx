import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

// SSR — always fresh
export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Partidas',
    description: 'Agenda e resultados de partidas.',
    openGraph: { title: 'Partidas — Agenda e Resultados' },
  }
}

const MATCHES = [
  { id: '2', home: 'Estrela Azul', away: 'Leões do Norte', homeScore: 2, awayScore: 1, championship: 'Copa Cidade', round: 'Fase de Grupos - R3', scheduledAt: '2026-06-09T19:00:00Z', status: 'live' },
  { id: '3', home: 'Tornado FC', away: 'Sport Clube', homeScore: null, awayScore: null, championship: 'Regional 2024', round: 'QF - Jogo 2', scheduledAt: '2026-06-10T20:00:00Z', status: 'scheduled' },
  { id: '5', home: 'Santos Atlético', away: 'Rápidos FC', homeScore: null, awayScore: null, championship: 'Regional 2024', round: 'QF - Jogo 3', scheduledAt: '2026-06-11T21:00:00Z', status: 'scheduled' },
  { id: '6', home: 'Guerreiros', away: 'Falcões EC', homeScore: null, awayScore: null, championship: 'Copa Cidade', round: 'Fase de Grupos - R4', scheduledAt: '2026-06-12T19:30:00Z', status: 'scheduled' },
  { id: '1', home: 'Rápidos FC', away: 'Unidos SC', homeScore: 3, awayScore: 1, championship: 'Regional 2024', round: 'QF - Jogo 1', scheduledAt: '2026-06-08T20:00:00Z', status: 'finished' },
  { id: '4', home: 'Guerreiros', away: 'Falcões EC', homeScore: 1, awayScore: 1, championship: 'Copa Cidade', round: 'Fase de Grupos - R3', scheduledAt: '2026-06-07T19:30:00Z', status: 'finished' },
]

const STATUS_MAP: Record<string, { label: string; variant: 'live' | 'success' | 'outline' }> = {
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrada', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'outline' },
}

function groupByDate(matches: typeof MATCHES) {
  const groups: Record<string, typeof MATCHES> = {}
  for (const m of matches) {
    const date = m.scheduledAt.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  }
  return groups
}

export default async function MatchesPublicPage({ params }: Props) {
  const { tenant } = await params
  const grouped = groupByDate(MATCHES)
  const dates = Object.keys(grouped).sort()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarDays className="size-7 text-primary" />
          Partidas
        </h1>
        <p className="mt-2 text-muted-foreground">Agenda completa e resultados.</p>
      </div>

      {dates.map((date) => {
        const [year, month, day] = date.split('-')
        const d = new Date(date + 'T12:00:00Z')
        const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold capitalize text-muted-foreground">{label}</h2>
              <div className="flex-1 h-px bg-border/40" />
            </div>
            <div className="space-y-2">
              {grouped[date].map((m) => {
                const st = STATUS_MAP[m.status]
                const hasScore = m.homeScore !== null && m.awayScore !== null
                return (
                  <Link key={m.id} href={`/${tenant}/matches/${m.id}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="flex items-center gap-4 p-4">
                        {/* Championship */}
                        <div className="hidden sm:block w-36 shrink-0">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">{m.championship}</p>
                          <p className="text-[10px] text-muted-foreground/70 truncate">{m.round}</p>
                        </div>

                        {/* Score / VS */}
                        <div className="flex flex-1 items-center justify-center gap-3">
                          <span className="flex-1 text-right text-sm font-semibold group-hover:text-primary/80 transition-colors">{m.home}</span>
                          {hasScore ? (
                            <span className="font-display text-xl font-bold text-foreground">
                              {m.homeScore} – {m.awayScore}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span className="font-display text-sm font-bold">{m.scheduledAt.split('T')[1].slice(0, 5)}</span>
                            </div>
                          )}
                          <span className="flex-1 text-left text-sm font-semibold group-hover:text-primary/80 transition-colors">{m.away}</span>
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
      })}
    </div>
  )
}
