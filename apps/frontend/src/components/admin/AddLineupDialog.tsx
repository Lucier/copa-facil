'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  fullName: string
  jerseyNumber: number | null
  mainPosition: string
}

interface Suspension {
  playerId: string
  reason: string
  status: string
}

interface AddLineupDialogProps {
  open: boolean
  matchId: string
  championshipId?: string
  homeTeam: Team
  awayTeam: Team
  existingPlayerIds: string[]
  onSuccess: () => void
  onClose: () => void
}

export function AddLineupDialog({
  open,
  matchId,
  championshipId,
  homeTeam,
  awayTeam,
  existingPlayerIds,
  onSuccess,
  onClose,
}: AddLineupDialogProps) {
  const queryClient = useQueryClient()
  const [teamId, setTeamId] = React.useState(homeTeam.id)
  const [playerId, setPlayerId] = React.useState('')
  const [jerseyNumber, setJerseyNumber] = React.useState('')
  const [position, setPosition] = React.useState('')
  const [isStarter, setIsStarter] = React.useState(true)
  const [isCaptain, setIsCaptain] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(teamId))
      return data as Player[]
    },
    enabled: Boolean(teamId),
  })

  const { data: activeSuspensions = [] } = useQuery<Suspension[]>({
    queryKey: ['suspensions', championshipId],
    queryFn: async () => {
      const { data } = await api.get(API.disciplinary.list(championshipId!, 'ativa'))
      return data as Suspension[]
    },
    enabled: Boolean(championshipId),
  })

  const suspendedPlayerIds = new Set(activeSuspensions.map((s) => s.playerId))

  const availablePlayers = players.filter((p) => !existingPlayerIds.includes(p.id))

  React.useEffect(() => {
    setPlayerId('')
    setJerseyNumber('')
    setPosition('')
  }, [teamId])

  React.useEffect(() => {
    const p = players.find((p) => p.id === playerId)
    if (p) {
      setJerseyNumber(p.jerseyNumber?.toString() ?? '')
      setPosition(p.mainPosition)
    }
  }, [playerId, players])

  const mutation = useMutation({
    mutationFn: () =>
      api.post(API.sumula.lineup(matchId), {
        teamId,
        playerId,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
        position: position || undefined,
        isStarter,
        isCaptain,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sumula', matchId] })
      onSuccess()
      handleClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao adicionar jogador.'
      setError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  function handleClose() {
    setTeamId(homeTeam.id)
    setPlayerId('')
    setJerseyNumber('')
    setPosition('')
    setIsStarter(true)
    setIsCaptain(false)
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId) { setError('Selecione um jogador.'); return }
    setError(null)
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Jogador à Escalação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team selector */}
          <div className="space-y-1.5">
            <Label>Time</Label>
            <div className="flex gap-2">
              {[homeTeam, awayTeam].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamId(t.id)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    teamId === t.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Player selector */}
          <div className="space-y-1.5">
            <Label htmlFor="playerId">Jogador</Label>
            <select
              id="playerId"
              value={playerId}
              onChange={(e) => setPlayerId((e.target as HTMLSelectElement).value)}
              className={SELECT_CLASS}
            >
              <option value="">Selecione um jogador...</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.fullName}
                  {suspendedPlayerIds.has(p.id) ? ' ⚠ SUSPENSO' : ''}
                </option>
              ))}
            </select>
            {availablePlayers.length === 0 && players.length > 0 && (
              <p className="text-xs text-muted-foreground">Todos os jogadores deste time já foram adicionados.</p>
            )}
          </div>

          {/* Suspension warning */}
          {playerId && suspendedPlayerIds.has(playerId) && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <p className="font-semibold text-amber-500">Jogador suspenso</p>
                <p className="text-amber-500/80 mt-0.5">
                  {activeSuspensions.find((s) => s.playerId === playerId)?.reason ?? 'Suspensão ativa neste campeonato'}.
                  Confirme apenas se a suspensão já foi cumprida.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jerseyNumber">Camisa</Label>
              <Input
                id="jerseyNumber"
                type="number"
                min={1}
                max={99}
                placeholder="ex: 9"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Posição</Label>
              <Input
                id="position"
                placeholder="ex: atacante"
                value={position}
                onChange={(e) => setPosition((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isStarter}
                onChange={(e) => setIsStarter((e.target as HTMLInputElement).checked)}
                className="size-4 rounded border-border accent-primary"
              />
              Titular
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isCaptain}
                onChange={(e) => setIsCaptain((e.target as HTMLInputElement).checked)}
                className="size-4 rounded border-border accent-primary"
              />
              Capitão
            </label>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !playerId}>
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
