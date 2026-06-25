'use client'
import * as React from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import api from '@/services/api'
import { API } from '@/services/endpoints'
import { formatDateTime } from '@/lib/utils'

/* ─────────────── types ─────────────── */

interface Sumula {
  id: string
  matchId: string
  championshipId: string
  venue: string | null
  observations: string | null
  status: 'aberta' | 'fechada'
  closedAt: string | null
  integrityHash: string | null
  createdAt: string
}

interface MatchLineup {
  id: string
  teamId: string
  playerId: string
  jerseyNumber: number | null
  position: string | null
  isStarter: boolean
  isCaptain: boolean
}

interface MatchOfficial {
  id: string
  name: string
  role: string
  licenseNumber: string | null
}

interface MatchEvent {
  id: string
  eventType: string
  teamId: string
  playerId: string | null
  assistPlayerId: string | null
  playerOutId: string | null
  playerInId: string | null
  minute: number
  goalType: string | null
  cardColor: string | null
}

interface SumulaView {
  sumula: Sumula
  lineup: MatchLineup[]
  officials: MatchOfficial[]
  events: MatchEvent[]
}

interface MatchAdmin {
  id: string
  status: string
  homeTeamId: string | null
  awayTeamId: string | null
  homeTeamName: string | null
  homeTeamAcronym: string | null
  awayTeamName: string | null
  awayTeamAcronym: string | null
  homeScore: number
  awayScore: number
  scheduledAt: string | null
  roundName: string
  roundPhase: string
}

interface Player {
  id: string
  fullName: string
  jerseyNumber: number | null
  mainPosition: string
}

/* ─────────────── constants ─────────────── */

const OFFICIAL_ROLE_LABELS: Record<string, string> = {
  arbitro_principal: 'Árbitro Principal',
  assistente_1: 'Assistente 1',
  assistente_2: 'Assistente 2',
  quarto_arbitro: 'Quarto Árbitro',
  assessor: 'Assessor',
  delegado: 'Delegado',
}

function teamLabel(name: string | null, acronym: string | null) {
  return name ?? acronym ?? 'A definir'
}

function eventDescription(
  ev: MatchEvent,
  playerMap: Record<string, string>,
): string {
  if (ev.eventType === 'GOL') {
    const scorer = ev.playerId ? playerMap[ev.playerId] ?? '?' : '?'
    const goal =
      ev.goalType === 'PENALTI' ? ' (pênalti)' : ev.goalType === 'CONTRA' ? ' (gol contra)' : ''
    const assist =
      ev.assistPlayerId && playerMap[ev.assistPlayerId]
        ? ` · Assistência: ${playerMap[ev.assistPlayerId]}`
        : ''
    return `Gol — ${scorer}${goal}${assist}`
  }
  if (ev.eventType === 'CARTAO') {
    const player = ev.playerId ? playerMap[ev.playerId] ?? '?' : '?'
    const color = ev.cardColor === 'AMARELO' ? 'Amarelo' : 'Vermelho'
    return `Cartão ${color} — ${player}`
  }
  if (ev.eventType === 'EXPULSAO') {
    const player = ev.playerId ? playerMap[ev.playerId] ?? '?' : '?'
    return `Expulsão — ${player}`
  }
  if (ev.eventType === 'SUBSTITUICAO') {
    const out = ev.playerOutId ? playerMap[ev.playerOutId] ?? '?' : '?'
    const inn = ev.playerInId ? playerMap[ev.playerInId] ?? '?' : '?'
    return `Substituição: sai ${out} / entra ${inn}`
  }
  return ev.eventType
}

/* ─────────────── page ─────────────── */

export default function PrintSumulaPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const champId = useSearchParams().get('champId') ?? ''

  const { data: sumulaView, isLoading, isError } = useQuery<SumulaView>({
    queryKey: ['sumula', matchId],
    queryFn: async () => {
      const { data } = await api.get(API.sumula.get(matchId))
      return data as SumulaView
    },
  })

  const { data: champMatches = [] } = useQuery<MatchAdmin[]>({
    queryKey: ['matches', champId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.matches(champId))
      return data as MatchAdmin[]
    },
    enabled: Boolean(champId) || Boolean(sumulaView?.sumula.championshipId),
  })

  const resolvedChampId = champId || sumulaView?.sumula.championshipId || ''
  const { data: champMatchesFallback = [] } = useQuery<MatchAdmin[]>({
    queryKey: ['matches', resolvedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.matches(resolvedChampId))
      return data as MatchAdmin[]
    },
    enabled: Boolean(resolvedChampId) && !champId,
  })

  const allMatches = champMatches.length > 0 ? champMatches : champMatchesFallback
  const match = allMatches.find((m) => m.id === matchId) ?? null

  const homeTeamId = match?.homeTeamId ?? ''
  const awayTeamId = match?.awayTeamId ?? ''

  const { data: homePlayers = [] } = useQuery<Player[]>({
    queryKey: ['players', homeTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(homeTeamId))
      return data as Player[]
    },
    enabled: Boolean(homeTeamId),
  })

  const { data: awayPlayers = [] } = useQuery<Player[]>({
    queryKey: ['players', awayTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(awayTeamId))
      return data as Player[]
    },
    enabled: Boolean(awayTeamId),
  })

  const playerMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of [...homePlayers, ...awayPlayers]) map[p.id] = p.fullName
    return map
  }, [homePlayers, awayPlayers])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !sumulaView) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-600">
        Súmula não encontrada.
      </div>
    )
  }

  const { sumula, lineup, officials, events } = sumulaView
  const homeLineup = lineup.filter((l) => l.teamId === homeTeamId)
  const awayLineup = lineup.filter((l) => l.teamId === awayTeamId)
  const homeName = teamLabel(match?.homeTeamName ?? null, match?.homeTeamAcronym ?? null)
  const awayName = teamLabel(match?.awayTeamName ?? null, match?.awayTeamAcronym ?? null)

  return (
    <div className="mx-auto max-w-3xl p-8 font-sans text-sm text-black">

      {/* Print button — hidden when printing */}
      <div className="mb-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Header */}
      <div className="border-b-2 border-black pb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-500">Súmula Oficial</p>
        <h1 className="mt-1 text-2xl font-bold">{homeName} × {awayName}</h1>
        {match && (
          <p className="mt-1 text-sm text-gray-600">
            {match.roundName}
            {match.scheduledAt ? ` · ${formatDateTime(match.scheduledAt)}` : ''}
          </p>
        )}
        {sumula.venue && (
          <p className="text-sm text-gray-600">📍 {sumula.venue}</p>
        )}
      </div>

      {/* Score */}
      {match && (match.status === 'finished' || match.status === 'live') && (
        <div className="my-6 text-center">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">{homeName}</p>
              <p className="text-5xl font-bold">{match.homeScore}</p>
            </div>
            <p className="text-2xl font-light text-gray-400">×</p>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase">{awayName}</p>
              <p className="text-5xl font-bold">{match.awayScore}</p>
            </div>
          </div>
          <p className="mt-2 text-xs uppercase tracking-widest text-gray-400">
            {match.status === 'finished' ? 'Resultado Final' : 'Em Andamento'}
          </p>
        </div>
      )}

      {/* Escalação */}
      {lineup.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Escalação
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-6">
            <LineupSection title={homeName} entries={homeLineup} playerMap={playerMap} />
            <LineupSection title={awayName} entries={awayLineup} playerMap={playerMap} />
          </div>
        </section>
      )}

      {/* Árbitros */}
      {officials.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Equipe de Arbitragem
          </h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {officials.map((o) => (
                <tr key={o.id} className="border-b border-gray-100">
                  <td className="py-1.5 font-medium">{o.name}</td>
                  <td className="py-1.5 text-gray-500">{OFFICIAL_ROLE_LABELS[o.role] ?? o.role}</td>
                  <td className="py-1.5 font-mono text-xs text-gray-400">{o.licenseNumber ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Eventos */}
      {events.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Eventos da Partida
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="pb-1 pr-3 font-normal">Min.</th>
                <th className="pb-1 pr-3 font-normal">Time</th>
                <th className="pb-1 font-normal">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {[...events].sort((a, b) => a.minute - b.minute).map((ev) => {
                const isHome = ev.teamId === homeTeamId
                return (
                  <tr key={ev.id} className="border-b border-gray-100">
                    <td className="py-1.5 pr-3 font-mono text-xs">{ev.minute}'</td>
                    <td className="py-1.5 pr-3 text-xs text-gray-500">
                      {isHome ? homeName : awayName}
                    </td>
                    <td className="py-1.5">{eventDescription(ev, playerMap)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Observações */}
      {sumula.observations && (
        <section className="mt-6">
          <h2 className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Observações
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{sumula.observations}</p>
        </section>
      )}

      {/* Assinatura digital */}
      {sumula.status === 'fechada' && sumula.integrityHash && (
        <section className="mt-8 border-t-2 border-black pt-4">
          <p className="text-xs font-bold uppercase tracking-wider">Autenticação Digital</p>
          {sumula.closedAt && (
            <p className="mt-1 text-xs text-gray-500">Fechada em: {formatDateTime(sumula.closedAt)}</p>
          )}
          <p className="mt-1 break-all font-mono text-[10px] text-gray-400">
            SHA-256: {sumula.integrityHash}
          </p>
        </section>
      )}

      {/* Assinaturas */}
      <section className="mt-12 grid grid-cols-2 gap-8">
        <div>
          <div className="border-t border-gray-400 pt-2 text-center">
            <p className="text-xs text-gray-500">Árbitro Principal</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2 text-center">
            <p className="text-xs text-gray-500">Delegado / Organizador</p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─────────────── LineupSection ─────────────── */

function LineupSection({
  title,
  entries,
  playerMap,
}: {
  title: string
  entries: MatchLineup[]
  playerMap: Record<string, string>
}) {
  const starters = entries.filter((e) => e.isStarter)
  const subs = entries.filter((e) => !e.isStarter)

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-gray-700">{title}</p>
      {starters.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {starters.map((e) => (
              <LineupRow key={e.id} entry={e} playerMap={playerMap} />
            ))}
          </tbody>
        </table>
      )}
      {subs.length > 0 && (
        <>
          <p className="mt-2 mb-1 text-[10px] font-semibold uppercase text-gray-400">Reservas</p>
          <table className="w-full text-xs">
            <tbody>
              {subs.map((e) => (
                <LineupRow key={e.id} entry={e} playerMap={playerMap} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function LineupRow({ entry, playerMap }: { entry: MatchLineup; playerMap: Record<string, string> }) {
  return (
    <tr className="border-b border-gray-100">
      {entry.jerseyNumber !== null && (
        <td className="w-6 py-1 pr-2 text-center font-mono text-gray-400">#{entry.jerseyNumber}</td>
      )}
      <td className="py-1">
        {playerMap[entry.playerId] ?? entry.playerId.slice(0, 8)}
        {entry.isCaptain && <span className="ml-1 text-[9px] font-bold text-amber-600">(C)</span>}
      </td>
      {entry.position && (
        <td className="py-1 text-right text-gray-400">{entry.position}</td>
      )}
    </tr>
  )
}
