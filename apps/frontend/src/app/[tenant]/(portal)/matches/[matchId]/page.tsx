import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Circle, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDateTime, getInitials } from '@/lib/utils'

// SSR — scores and events must be always fresh
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ tenant: string; matchId: string }>
}

const MATCHES_DATA: Record<string, {
  id: string
  home: string; homeScore: number
  away: string; awayScore: number
  championship: string; round: string
  scheduledAt: string; status: string
  events: Array<{ minute: number; type: 'goal' | 'yellow' | 'red' | 'sub'; team: 'home' | 'away'; player: string; detail?: string }>
  homeLineup: string[]; awayLineup: string[]
}> = {
  '1': {
    id: '1', home: 'Rápidos FC', homeScore: 3, away: 'Unidos SC', awayScore: 1,
    championship: 'Regional 2024', round: 'Quartas de Final - Jogo 1',
    scheduledAt: '2026-06-08T20:00:00Z', status: 'finished',
    events: [
      { minute: 12, type: 'goal', team: 'home', player: 'Carlos Mendes', detail: 'Gol de pênalti' },
      { minute: 28, type: 'goal', team: 'home', player: 'Carlos Mendes', detail: 'Finalização de dentro da área' },
      { minute: 35, type: 'yellow', team: 'away', player: 'Diego Costa', detail: 'Falta' },
      { minute: 44, type: 'goal', team: 'away', player: 'Rafael Costa', detail: 'Contra-ataque' },
      { minute: 67, type: 'yellow', team: 'home', player: 'Diego Silva', detail: 'Entrada dura' },
      { minute: 78, type: 'goal', team: 'home', player: 'Carlos Mendes', detail: 'Hat-trick — cabeçada no canto' },
    ],
    homeLineup: ['Lucas Pereira', 'Diego Silva', 'André Santos', 'Marcos Lima', 'Felipe Costa',
      'Bruno Alves', 'Rafael Lima', 'Thiago Souza', 'Pedro Santos', 'Carlos Mendes', 'João Ferreira'],
    awayLineup: ['Fernando Costa', 'Marcos Oliveira', 'Paulo Rocha', 'Ricardo Gomes', 'Gabriel Lima',
      'Renato Alves', 'Rafael Costa', 'Leandro Cruz', 'Anderson Silva', 'Felipe Mendes', 'Diego Costa'],
  },
  '2': {
    id: '2', home: 'Estrela Azul', homeScore: 2, away: 'Leões do Norte', awayScore: 1,
    championship: 'Copa Cidade', round: 'Fase de Grupos - Rodada 3',
    scheduledAt: '2026-06-09T19:00:00Z', status: 'live',
    events: [
      { minute: 23, type: 'goal', team: 'home', player: 'Pedro Rocha', detail: 'Chute de fora da área' },
      { minute: 41, type: 'goal', team: 'away', player: 'Fernando Alves', detail: 'Pênalti convertido' },
      { minute: 58, type: 'yellow', team: 'away', player: 'Carlos Lima', detail: 'Reclamação' },
      { minute: 67, type: 'goal', team: 'home', player: 'Lucas Santana', detail: 'Cabeçada no segundo poste' },
    ],
    homeLineup: ['Rodrigo Santos', 'Eduardo Lima', 'Caio Ferreira', 'Lucas Santana', 'Pedro Rocha',
      'André Melo', 'Vitor Hugo', 'Gustavo Costa', 'Felipe Rocha', 'Bruno Santos', 'Mateus Lima'],
    awayLineup: ['Alexandre Costa', 'João Lima', 'Marcelo Santos', 'Ricardo Ferreira', 'Fernando Alves',
      'Carlos Lima', 'Diego Rocha', 'Paulo Melo', 'Rodrigo Costa', 'Anderson Lima', 'Felipe Santos'],
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchId } = await params
  const match = MATCHES_DATA[matchId]
  if (!match) return { title: 'Partida não encontrada' }
  const score = `${match.homeScore} × ${match.awayScore}`
  return {
    title: `${match.home} ${score} ${match.away}`,
    description: `${match.championship} — ${match.round}. Acompanhe eventos, escalação e placar.`,
    openGraph: {
      title: `${match.home} ${score} ${match.away} | ${match.championship}`,
      description: `${match.round} — ${formatDateTime(match.scheduledAt)}`,
    },
  }
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  goal: <span className="text-lg">⚽</span>,
  yellow: <Square className="size-4 fill-amber-400 text-amber-400" />,
  red: <Square className="size-4 fill-red-500 text-red-500" />,
  sub: <span className="text-base">🔄</span>,
}

export default async function MatchCenterPage({ params }: Props) {
  const { tenant, matchId } = await params
  const match = MATCHES_DATA[matchId]
  if (!match) notFound()

  const isLive = match.status === 'live'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.home} vs ${match.away}`,
    startDate: match.scheduledAt,
    homeTeam: { '@type': 'SportsTeam', name: match.home },
    awayTeam: { '@type': 'SportsTeam', name: match.away },
    location: { '@type': 'Place', name: 'Estádio Municipal' },
    superEvent: { '@type': 'SportsOrganization', name: match.championship },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link href={`/${tenant}/matches`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Todas as partidas
        </Link>

        {/* Match header */}
        <div className="rounded-xl border border-border bg-card/60 p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{match.championship}</span>
            <span>·</span>
            <span>{match.round}</span>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex flex-1 flex-col items-end gap-2">
              <Avatar className="size-14">
                <AvatarFallback className="text-lg">{getInitials(match.home)}</AvatarFallback>
              </Avatar>
              <span className="font-display text-lg font-bold">{match.home}</span>
            </div>

            <div className="text-center space-y-1">
              {isLive ? (
                <Badge variant="live" className="mb-2">AO VIVO</Badge>
              ) : (
                <Badge variant="success" className="mb-2">Encerrada</Badge>
              )}
              <div className="font-display text-5xl font-bold tracking-tight">
                {match.homeScore} <span className="text-muted-foreground">–</span> {match.awayScore}
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(match.scheduledAt)}</p>
            </div>

            <div className="flex flex-1 flex-col items-start gap-2">
              <Avatar className="size-14">
                <AvatarFallback className="text-lg">{getInitials(match.away)}</AvatarFallback>
              </Avatar>
              <span className="font-display text-lg font-bold">{match.away}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Event timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {match.events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sem eventos registrados.</p>
              ) : (
                match.events.map((ev, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50 ${ev.team === 'home' ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <span className="w-10 shrink-0 font-display text-sm font-bold text-muted-foreground text-center">
                      {ev.minute}'
                    </span>
                    <div className="flex size-8 shrink-0 items-center justify-center">
                      {EVENT_ICONS[ev.type]}
                    </div>
                    <div className={`flex-1 ${ev.team === 'away' ? 'text-right' : ''}`}>
                      <p className="text-sm font-semibold">{ev.player}</p>
                      {ev.detail && <p className="text-[11px] text-muted-foreground">{ev.detail}</p>}
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase text-muted-foreground ${ev.team === 'away' ? 'mr-auto ml-0' : 'ml-auto mr-0'}`}>
                      {ev.team === 'home' ? match.home.split(' ')[0] : match.away.split(' ')[0]}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Lineups */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Escalações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold text-primary">{match.home}</p>
                <ol className="space-y-1">
                  {match.homeLineup.map((p, i) => (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="h-px bg-border/40" />
              <div>
                <p className="mb-2 text-xs font-bold text-blue-400">{match.away}</p>
                <ol className="space-y-1">
                  {match.awayLineup.map((p, i) => (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
