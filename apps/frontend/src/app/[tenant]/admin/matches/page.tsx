'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock, CheckCircle2, Play, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConcludeMatchDialog } from '@/components/admin/ConcludeMatchDialog'
import { formatDateTime } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' | 'outline' }> = {
  live: { label: 'Ao Vivo', variant: 'live' },
  finished: { label: 'Encerrada', variant: 'success' },
  scheduled: { label: 'Agendada', variant: 'outline' },
}

interface Championship {
  id: string
  name: string
  season: string
  status: string
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
  startedAt: string | null
  endedAt: string | null
  roundId: string
  roundNumber: number
  roundName: string
  roundPhase: string
  groupId: string | null
  bracketSlot: number | null
  isBye: boolean
}

function teamLabel(name: string | null, acronym: string | null): string {
  return name ?? acronym ?? 'A definir'
}

export default function MatchesPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState<string>('')
  const [matchToStart, setMatchToStart] = React.useState<MatchAdmin | null>(null)
  const [matchToConclude, setMatchToConclude] = React.useState<MatchAdmin | null>(null)
  const [startError, setStartError] = React.useState<string | null>(null)

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data } = await api.get(API.championships.base)
      return data as Championship[]
    },
  })

  React.useEffect(() => {
    if (championships.length > 0 && !selectedChampId) {
      setSelectedChampId(championships[0].id)
    }
  }, [championships, selectedChampId])

  const { data: matches = [], isLoading, isError } = useQuery<MatchAdmin[]>({
    queryKey: ['matches', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.matches(selectedChampId))
      return data as MatchAdmin[]
    },
    enabled: Boolean(selectedChampId),
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(API.matches.start(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', selectedChampId] })
      setMatchToStart(null)
      setStartError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao iniciar partida.'
      setStartError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['matches', selectedChampId] })
  }

  const roundGroups = React.useMemo(() => {
    const map = new Map<string, { roundNumber: number; roundName: string; roundPhase: string; matches: MatchAdmin[] }>()
    for (const m of matches) {
      if (m.isBye) continue
      if (!map.has(m.roundId)) {
        map.set(m.roundId, { roundNumber: m.roundNumber, roundName: m.roundName, roundPhase: m.roundPhase, matches: [] })
      }
      map.get(m.roundId)!.matches.push(m)
    }
    return Array.from(map.values()).sort((a, b) => a.roundNumber - b.roundNumber)
  }, [matches])

  const liveCount = matches.filter((m) => m.status === 'live').length
  const scheduledCount = matches.filter((m) => m.status === 'scheduled').length
  const finishedCount = matches.filter((m) => m.status === 'finished').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Partidas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe e gerencie as partidas dos campeonatos.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Campeonato:</label>
        <select
          value={selectedChampId}
          onChange={(e) => setSelectedChampId((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          {championships.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={liveCount > 0 ? 'border-primary/30 bg-primary/5' : ''}>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className={`size-8 ${liveCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className={`font-display text-2xl font-bold ${liveCount > 0 ? 'text-primary' : ''}`}>{liveCount}</p>
              <p className="text-xs text-muted-foreground">Ao Vivo Agora</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CalendarDays className="size-8 text-muted-foreground" />
            <div>
              <p className="font-display text-2xl font-bold">{scheduledCount}</p>
              <p className="text-xs text-muted-foreground">Agendadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle2 className="size-8 text-emerald-400" />
            <div>
              <p className="font-display text-2xl font-bold">{finishedCount}</p>
              <p className="text-xs text-muted-foreground">Realizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground py-8">Carregando partidas...</p>
      )}
      {isError && (
        <p className="text-center text-sm text-destructive py-8">Erro ao carregar partidas. Verifique se o campeonato possui fixtures gerados.</p>
      )}
      {!isLoading && !isError && selectedChampId && roundGroups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhuma partida encontrada. Gere os fixtures do campeonato primeiro.</p>
      )}

      {roundGroups.map((round) => (
        <Card key={round.roundNumber}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{round.roundName}</span>
              <span className="text-xs font-normal normal-case">— {round.roundPhase}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confronto</TableHead>
                  <TableHead className="text-center">Placar</TableHead>
                  <TableHead>Data & Hora</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {round.matches.map((m) => {
                  const st = STATUS_MAP[m.status] ?? STATUS_MAP.scheduled
                  const home = teamLabel(m.homeTeamName, m.homeTeamAcronym)
                  const away = teamLabel(m.awayTeamName, m.awayTeamAcronym)
                  const hasScore = m.status === 'live' || m.status === 'finished'
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="text-sm font-medium">{home}</span>
                        <span className="mx-2 text-xs text-muted-foreground">vs.</span>
                        <span className="text-sm font-medium">{away}</span>
                      </TableCell>
                      <TableCell className="text-center font-display font-bold text-sm">
                        {hasScore ? `${m.homeScore} – ${m.awayScore}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.scheduledAt ? formatDateTime(m.scheduledAt) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => { setMatchToStart(m); setStartError(null) }}
                            >
                              <Play className="size-3" />
                              Iniciar
                            </Button>
                          )}
                          {m.status === 'live' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                              onClick={() => setMatchToConclude(m)}
                            >
                              <Flag className="size-3" />
                              Encerrar
                            </Button>
                          )}
                          {m.status === 'finished' && (
                            <span className="text-xs text-muted-foreground">Finalizada</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Confirm start dialog */}
      <Dialog open={Boolean(matchToStart)} onOpenChange={(open) => { if (!open) { setMatchToStart(null); setStartError(null) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Iniciar Partida?</DialogTitle>
          </DialogHeader>
          {matchToStart && (
            <p className="text-sm text-muted-foreground">
              {teamLabel(matchToStart.homeTeamName, matchToStart.homeTeamAcronym)}
              <span className="mx-2 font-medium text-foreground">vs.</span>
              {teamLabel(matchToStart.awayTeamName, matchToStart.awayTeamAcronym)}
            </p>
          )}
          {startError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{startError}</p>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => { setMatchToStart(null); setStartError(null) }} disabled={startMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => matchToStart && startMutation.mutate(matchToStart.id)}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending && <Clock className="mr-2 size-4 animate-spin" />}
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conclude match dialog */}
      <ConcludeMatchDialog
        matchId={matchToConclude?.id ?? null}
        homeTeamName={teamLabel(matchToConclude?.homeTeamName ?? null, matchToConclude?.homeTeamAcronym ?? null)}
        awayTeamName={teamLabel(matchToConclude?.awayTeamName ?? null, matchToConclude?.awayTeamAcronym ?? null)}
        onSuccess={handleSuccess}
        onClose={() => setMatchToConclude(null)}
      />
    </div>
  )
}
