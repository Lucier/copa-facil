'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldAlert, Plus, CheckCircle2, XCircle, AlertTriangle, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { AddSuspensionDialog } from '@/components/admin/AddSuspensionDialog'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

/* ─────────────── types ─────────────── */

interface Championship {
  id: string
  name: string
  season: string
  status: string
}

interface Suspension {
  id: string
  championshipId: string
  playerId: string
  playerName: string | null
  teamId: string
  teamName: string | null
  teamAcronym: string | null
  reason: string
  source: 'auto' | 'manual'
  matchesToServe: number
  matchesServed: number
  status: 'ativa' | 'cumprida' | 'cancelada'
  eventId: string | null
  notes: string | null
  createdAt: string
}

/* ─────────────── constants ─────────────── */

const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  cumprida: 'Cumprida',
  cancelada: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'destructive' | 'success' | 'outline'> = {
  ativa: 'destructive',
  cumprida: 'success',
  cancelada: 'outline',
}

const SOURCE_LABELS: Record<string, string> = {
  auto: 'Automática',
  manual: 'Manual',
}

/* ─────────────── page ─────────────── */

export default function DisciplinaryPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)
  const [confirmServe, setConfirmServe] = React.useState<Suspension | null>(null)
  const [confirmCancel, setConfirmCancel] = React.useState<Suspension | null>(null)
  const [statusFilter, setStatusFilter] = React.useState('')

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

  const { data: suspensions = [], isLoading, isError } = useQuery<Suspension[]>({
    queryKey: ['suspensions', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.disciplinary.list(selectedChampId))
      return data as Suspension[]
    },
    enabled: Boolean(selectedChampId),
  })

  const serveMutation = useMutation({
    mutationFn: (s: Suspension) => api.post(API.disciplinary.serve(s.championshipId, s.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions', selectedChampId] })
      setConfirmServe(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (s: Suspension) => api.delete(API.disciplinary.cancel(s.championshipId, s.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions', selectedChampId] })
      setConfirmCancel(null)
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['suspensions', selectedChampId] })
  }

  const filtered = React.useMemo(() => {
    if (!statusFilter) return suspensions
    return suspensions.filter((s) => s.status === statusFilter)
  }, [suspensions, statusFilter])

  const activeCount = suspensions.filter((s) => s.status === 'ativa').length
  const autoCount = suspensions.filter((s) => s.source === 'auto').length
  const manualCount = suspensions.filter((s) => s.source === 'manual').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Controle Disciplinar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suspensões automáticas (cartões/expulsões) e punições manuais.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          disabled={!selectedChampId}
          onClick={() => setShowAdd(true)}
        >
          <Plus className="size-4" />
          Nova Suspensão
        </Button>
      </div>

      {/* Championship selector */}
      <div className="flex items-center gap-3 flex-wrap">
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="cumprida">Cumpridas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={activeCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
          <CardContent className="flex items-center gap-4 p-4">
            <ShieldAlert className={`size-8 ${activeCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div>
              <p className={`font-display text-2xl font-bold ${activeCount > 0 ? 'text-destructive' : ''}`}>{activeCount}</p>
              <p className="text-xs text-muted-foreground">Suspensões Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="size-8 text-amber-400" />
            <div>
              <p className="font-display text-2xl font-bold">{autoCount}</p>
              <p className="text-xs text-muted-foreground">Automáticas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="size-8 text-muted-foreground" />
            <div>
              <p className="font-display text-2xl font-bold">{manualCount}</p>
              <p className="text-xs text-muted-foreground">Manuais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'suspensão' : 'suspensões'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar suspensões.</p>
          )}
          {!isLoading && !isError && suspensions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ShieldAlert className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma suspensão registrada neste campeonato.
              </p>
              <p className="text-xs text-muted-foreground">
                Suspensões são criadas automaticamente ao registrar cartão vermelho, expulsão
                ou acúmulo de 3 cartões amarelos.
              </p>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-center">Origem</TableHead>
                  <TableHead className="text-center">Jogos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className={s.status !== 'ativa' ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      {s.playerName ?? <span className="text-muted-foreground font-mono text-xs">{s.playerId.slice(0, 8)}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.teamName ?? s.teamAcronym ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{s.reason}</p>
                        {s.notes && (
                          <p className="text-xs text-muted-foreground">{s.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.source === 'auto' ? 'warning' : 'outline'}>
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm">
                        {s.matchesServed}/{s.matchesToServe}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={STATUS_VARIANTS[s.status] ?? 'outline'}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === 'ativa' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-emerald-400 hover:text-emerald-400"
                              title="Registrar jogo cumprido"
                              onClick={() => setConfirmServe(s)}
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              title="Cancelar suspensão"
                              onClick={() => setConfirmCancel(s)}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <AddSuspensionDialog
        open={showAdd}
        championshipId={selectedChampId}
        onSuccess={handleSuccess}
        onClose={() => setShowAdd(false)}
      />

      {/* Confirm serve */}
      <Dialog open={Boolean(confirmServe)} onOpenChange={(o) => { if (!o) setConfirmServe(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar jogo cumprido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Isso incrementa um jogo na suspensão de{' '}
            <strong className="text-foreground">{confirmServe?.playerName ?? '—'}</strong>.{' '}
            {confirmServe && confirmServe.matchesServed + 1 >= confirmServe.matchesToServe
              ? 'A suspensão será marcada como cumprida.'
              : `Restarão ${confirmServe ? confirmServe.matchesToServe - confirmServe.matchesServed - 1 : 0} jogo(s).`}
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setConfirmServe(null)} disabled={serveMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => confirmServe && serveMutation.mutate(confirmServe)}
              disabled={serveMutation.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm cancel */}
      <Dialog open={Boolean(confirmCancel)} onOpenChange={(o) => { if (!o) setConfirmCancel(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar suspensão?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A suspensão de{' '}
            <strong className="text-foreground">{confirmCancel?.playerName ?? '—'}</strong>{' '}
            ({confirmCancel?.reason}) será cancelada e o jogador liberado imediatamente.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setConfirmCancel(null)} disabled={cancelMutation.isPending}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmCancel && cancelMutation.mutate(confirmCancel)}
              disabled={cancelMutation.isPending}
            >
              Cancelar suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
