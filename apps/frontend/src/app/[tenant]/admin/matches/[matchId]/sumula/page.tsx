'use client'
import * as React from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Plus, Trash2, Lock, Loader2,
  User, Users, Clock, Square, ClipboardCheck, Printer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AddLineupDialog } from '@/components/admin/AddLineupDialog'
import { AddOfficialDialog } from '@/components/admin/AddOfficialDialog'
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
  closedBy: string | null
  integrityHash: string | null
  createdAt: string
  updatedAt: string
}

interface MatchLineup {
  id: string
  matchId: string
  teamId: string
  playerId: string
  jerseyNumber: number | null
  position: string | null
  isStarter: boolean
  isCaptain: boolean
  addedAt: string
}

interface MatchOfficial {
  id: string
  matchId: string
  name: string
  role: string
  licenseNumber: string | null
  createdAt: string
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
  createdAt: string
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

const INPUT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function teamLabel(name: string | null, acronym: string | null) {
  return name ?? acronym ?? 'A definir'
}

function EventIcon({ type, cardColor }: { type: string; cardColor: string | null }) {
  if (type === 'GOL') return <span className="text-base leading-none">⚽</span>
  if (type === 'EXPULSAO') return <Square className="size-4 fill-red-500 text-red-500" />
  if (type === 'CARTAO') {
    return cardColor === 'AMARELO'
      ? <Square className="size-4 fill-amber-400 text-amber-400" />
      : <Square className="size-4 fill-red-500 text-red-500" />
  }
  if (type === 'SUBSTITUICAO') return <span className="text-base leading-none">🔄</span>
  return <Clock className="size-4 text-muted-foreground" />
}

/* ─────────────── page ─────────────── */

export default function SumulaPage() {
  const { tenant, matchId } = useParams<{ tenant: string; matchId: string }>()
  const champId = useSearchParams().get('champId') ?? ''
  const queryClient = useQueryClient()

  const [showAddLineup, setShowAddLineup] = React.useState(false)
  const [showAddOfficial, setShowAddOfficial] = React.useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false)
  const [observations, setObservations] = React.useState('')
  const [venue, setVenue] = React.useState('')
  const [openError, setOpenError] = React.useState<string | null>(null)
  const [closeError, setCloseError] = React.useState<string | null>(null)
  const [obsError, setObsError] = React.useState<string | null>(null)

  /* ── queries ── */

  const { data: champMatches = [] } = useQuery<MatchAdmin[]>({
    queryKey: ['matches', champId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.matches(champId))
      return data as MatchAdmin[]
    },
    enabled: Boolean(champId),
  })

  const match = champMatches.find((m) => m.id === matchId) ?? null

  const {
    data: sumulaView,
    isError: sumulaNotFound,
    isLoading: sumulaLoading,
  } = useQuery<SumulaView>({
    queryKey: ['sumula', matchId],
    queryFn: async () => {
      const { data } = await api.get(API.sumula.get(matchId))
      return data as SumulaView
    },
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 2
    },
  })

  React.useEffect(() => {
    if (sumulaView?.sumula.observations) {
      setObservations(sumulaView.sumula.observations)
    }
  }, [sumulaView?.sumula.observations])

  /* players for lineup builder */
  const { data: homePlayers = [] } = useQuery<Player[]>({
    queryKey: ['players', match?.homeTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(match!.homeTeamId!))
      return data as Player[]
    },
    enabled: Boolean(match?.homeTeamId),
  })

  const { data: awayPlayers = [] } = useQuery<Player[]>({
    queryKey: ['players', match?.awayTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(match!.awayTeamId!))
      return data as Player[]
    },
    enabled: Boolean(match?.awayTeamId),
  })

  const playerMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of [...homePlayers, ...awayPlayers]) {
      map[p.id] = p.fullName
    }
    return map
  }, [homePlayers, awayPlayers])

  /* ── mutations ── */

  const openMutation = useMutation({
    mutationFn: () => api.post(API.sumula.open(matchId), { venue: venue || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sumula', matchId] })
      setVenue('')
      setOpenError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao abrir súmula.'
      setOpenError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => api.post(API.sumula.close(matchId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sumula', matchId] })
      setShowCloseConfirm(false)
      setCloseError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao fechar súmula.'
      setCloseError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
      setShowCloseConfirm(false)
    },
  })

  const removeLineupMutation = useMutation({
    mutationFn: (lineupId: string) => api.delete(API.sumula.removeLineup(matchId, lineupId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sumula', matchId] }),
  })

  const removeOfficialMutation = useMutation({
    mutationFn: (officialId: string) => api.delete(`/matches/${matchId}/sumula/officials/${officialId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sumula', matchId] }),
  })

  const obsMutation = useMutation({
    mutationFn: () => api.patch(API.sumula.observations(matchId), { observations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sumula', matchId] })
      setObsError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao salvar observações.'
      setObsError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  /* ── derived ── */

  const sumula = sumulaView?.sumula ?? null
  const lineup = sumulaView?.lineup ?? []
  const officials = sumulaView?.officials ?? []
  const events = sumulaView?.events ?? []

  const homeLineup = lineup.filter((l) => l.teamId === match?.homeTeamId)
  const awayLineup = lineup.filter((l) => l.teamId === match?.awayTeamId)
  const existingPlayerIds = lineup.map((l) => l.playerId)

  const isClosed = sumula?.status === 'fechada'
  const canClose = sumula && !isClosed && match?.status === 'finished'

  const homeTeam = match ? { id: match.homeTeamId ?? '', name: teamLabel(match.homeTeamName, match.homeTeamAcronym) } : { id: '', name: 'Casa' }
  const awayTeam = match ? { id: match.awayTeamId ?? '', name: teamLabel(match.awayTeamName, match.awayTeamAcronym) } : { id: '', name: 'Visitante' }

  /* ── render ── */

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={`/${tenant}/admin/matches${champId ? `?champId=${champId}` : ''}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" /> Partidas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {match
              ? `${teamLabel(match.homeTeamName, match.homeTeamAcronym)} × ${teamLabel(match.awayTeamName, match.awayTeamAcronym)}`
              : 'Súmula'}
          </h1>
          {match && (
            <p className="mt-1 text-sm text-muted-foreground">
              {match.roundName}
              {match.scheduledAt ? ` · ${formatDateTime(match.scheduledAt)}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {match && (match.status === 'live' || match.status === 'finished') && (
            <span className="font-display text-2xl font-bold">
              {match.homeScore} – {match.awayScore}
            </span>
          )}
          {sumula && (
            <Badge variant={isClosed ? 'success' : 'warning'}>
              {isClosed ? 'Fechada' : 'Aberta'}
            </Badge>
          )}
          {sumula && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() =>
                window.open(
                  `/${tenant}/print/sumula/${matchId}${champId ? `?champId=${champId}` : ''}`,
                  '_blank',
                )
              }
            >
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          )}
          {canClose && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-primary/30 text-primary hover:text-primary"
              onClick={() => setShowCloseConfirm(true)}
            >
              <Lock className="size-3.5" />
              Fechar Súmula
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {sumulaLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Open sumula form */}
      {!sumulaLoading && sumulaNotFound && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <ClipboardCheck className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Súmula ainda não aberta</p>
              <p className="mt-1 text-sm text-muted-foreground">Abra a súmula para registrar escalações e árbitros.</p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="venueInput">Estádio (opcional)</Label>
                <Input
                  id="venueInput"
                  placeholder="ex: Estádio Municipal"
                  value={venue}
                  onChange={(e) => setVenue((e.target as HTMLInputElement).value)}
                />
              </div>
              {openError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{openError}</p>
              )}
              <Button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>
                {openMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Abrir Súmula
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sumula content */}
      {sumula && (
        <>
          {/* Venue + close error */}
          {(sumula.venue || closeError) && (
            <div className="flex flex-wrap items-center gap-4">
              {sumula.venue && (
                <p className="text-sm text-muted-foreground">
                  📍 <span className="font-medium text-foreground">{sumula.venue}</span>
                </p>
              )}
              {closeError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{closeError}</p>
              )}
            </div>
          )}

          {/* Escalação */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <Users className="size-4" />
                  Escalação
                </CardTitle>
                {!isClosed && match?.homeTeamId && match?.awayTeamId && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddLineup(true)}>
                    <Plus className="size-3.5" />
                    Adicionar Jogador
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {lineup.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum jogador adicionado.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <LineupColumn
                    title={homeTeam.name}
                    side="home"
                    entries={homeLineup}
                    playerMap={playerMap}
                    isClosed={isClosed}
                    onRemove={(id) => removeLineupMutation.mutate(id)}
                  />
                  <LineupColumn
                    title={awayTeam.name}
                    side="away"
                    entries={awayLineup}
                    playerMap={playerMap}
                    isClosed={isClosed}
                    onRemove={(id) => removeLineupMutation.mutate(id)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Árbitros */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <User className="size-4" />
                  Árbitros & Oficiais
                </CardTitle>
                {!isClosed && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddOfficial(true)}>
                    <Plus className="size-3.5" />
                    Adicionar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {officials.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhum árbitro registrado.</p>
              ) : (
                <ul className="divide-y divide-border/40">
                  {officials.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">{o.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {OFFICIAL_ROLE_LABELS[o.role] ?? o.role}
                          {o.licenseNumber ? ` · ${o.licenseNumber}` : ''}
                        </p>
                      </div>
                      {!isClosed && (
                        <button
                          onClick={() => removeOfficialMutation.mutate(o.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Eventos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <Clock className="size-4" />
                Eventos da Partida
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sem eventos registrados.</p>
              ) : (
                <ol className="space-y-1">
                  {events.map((ev) => {
                    const isHome = ev.teamId === match?.homeTeamId
                    return (
                      <li
                        key={ev.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent/40 ${isHome ? '' : 'flex-row-reverse'}`}
                      >
                        <span className="w-9 shrink-0 text-center font-display text-xs font-bold text-muted-foreground">
                          {ev.minute}'
                        </span>
                        <span className="flex size-7 shrink-0 items-center justify-center">
                          <EventIcon type={ev.eventType} cardColor={ev.cardColor} />
                        </span>
                        <div className={`flex-1 ${!isHome ? 'text-right' : ''}`}>
                          <span className="font-medium">
                            {ev.playerId && playerMap[ev.playerId]
                              ? playerMap[ev.playerId]
                              : ev.eventType === 'SUBSTITUICAO' && ev.playerOutId && playerMap[ev.playerOutId]
                              ? `${playerMap[ev.playerOutId]} → ${ev.playerInId && playerMap[ev.playerInId] ? playerMap[ev.playerInId] : '?'}`
                              : '—'}
                          </span>
                          {ev.goalType && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {ev.goalType === 'NORMAL' ? '' : ev.goalType === 'PENALTI' ? '(pênalti)' : '(gol contra)'}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
                          {isHome ? homeTeam.name.split(' ')[0] : awayTeam.name.split(' ')[0]}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={observations}
                onChange={(e) => setObservations((e.target as HTMLTextAreaElement).value)}
                disabled={isClosed}
                placeholder="Observações da partida, incidentes, etc."
                rows={4}
                className={`${INPUT_CLASS} h-auto resize-none disabled:cursor-not-allowed disabled:opacity-60`}
              />
              {obsError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{obsError}</p>
              )}
              {!isClosed && (
                <Button
                  size="sm"
                  onClick={() => obsMutation.mutate()}
                  disabled={obsMutation.isPending}
                >
                  {obsMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Salvar Observações
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Integrity hash */}
          {isClosed && sumula.integrityHash && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 py-4">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">Súmula fechada</p>
                  {sumula.closedAt && (
                    <p className="text-xs text-muted-foreground">{formatDateTime(sumula.closedAt)}</p>
                  )}
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                    SHA-256: {sumula.integrityHash}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogs */}
      {match?.homeTeamId && match?.awayTeamId && (
        <AddLineupDialog
          open={showAddLineup}
          matchId={matchId}
          championshipId={champId || sumulaView?.sumula.championshipId || undefined}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          existingPlayerIds={existingPlayerIds}
          onSuccess={() => {}}
          onClose={() => setShowAddLineup(false)}
        />
      )}

      <AddOfficialDialog
        open={showAddOfficial}
        matchId={matchId}
        onSuccess={() => {}}
        onClose={() => setShowAddOfficial(false)}
      />

      {/* Close confirm dialog */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Fechar Súmula?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ao fechar, a súmula será assinada digitalmente e não poderá mais ser editada. Esta ação é irreversível.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)} disabled={closeMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              {closeMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Fechar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─────────────── LineupColumn ─────────────── */

function LineupColumn({
  title,
  side,
  entries,
  playerMap,
  isClosed,
  onRemove,
}: {
  title: string
  side: 'home' | 'away'
  entries: MatchLineup[]
  playerMap: Record<string, string>
  isClosed: boolean
  onRemove: (id: string) => void
}) {
  const starters = entries.filter((e) => e.isStarter)
  const subs = entries.filter((e) => !e.isStarter)

  return (
    <div>
      <p className={`mb-2 text-xs font-bold ${side === 'home' ? 'text-primary' : 'text-blue-400'}`}>
        {title}
      </p>
      {starters.length > 0 && (
        <ul className="space-y-1">
          {starters.map((e) => (
            <LineupRow key={e.id} entry={e} playerMap={playerMap} isClosed={isClosed} onRemove={onRemove} />
          ))}
        </ul>
      )}
      {subs.length > 0 && (
        <>
          <p className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reservas</p>
          <ul className="space-y-1">
            {subs.map((e) => (
              <LineupRow key={e.id} entry={e} playerMap={playerMap} isClosed={isClosed} onRemove={onRemove} />
            ))}
          </ul>
        </>
      )}
      {entries.length === 0 && (
        <p className="py-2 text-xs text-muted-foreground">Sem jogadores.</p>
      )}
    </div>
  )
}

function LineupRow({
  entry,
  playerMap,
  isClosed,
  onRemove,
}: {
  entry: MatchLineup
  playerMap: Record<string, string>
  isClosed: boolean
  onRemove: (id: string) => void
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40">
      {entry.jerseyNumber !== null && (
        <span className="w-6 shrink-0 text-center text-[10px] font-bold text-muted-foreground">
          #{entry.jerseyNumber}
        </span>
      )}
      <span className="flex-1 truncate">
        {playerMap[entry.playerId] ?? entry.playerId.slice(0, 8)}
        {entry.isCaptain && <span className="ml-1.5 text-[10px] font-semibold text-amber-400">(C)</span>}
      </span>
      {entry.position && (
        <span className="text-[10px] text-muted-foreground">{entry.position}</span>
      )}
      {!isClosed && (
        <button
          onClick={() => onRemove(entry.id)}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
          title="Remover"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </li>
  )
}
