'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
  acronym: string | null
}

interface Player {
  id: string
  fullName: string
  jerseyNumber: number | null
}

interface AddSuspensionDialogProps {
  open: boolean
  championshipId: string
  onSuccess: () => void
  onClose: () => void
}

export function AddSuspensionDialog({
  open,
  championshipId,
  onSuccess,
  onClose,
}: AddSuspensionDialogProps) {
  const queryClient = useQueryClient()
  const [teamId, setTeamId] = React.useState('')
  const [playerId, setPlayerId] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [matchesToServe, setMatchesToServe] = React.useState(1)
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
    enabled: open,
  })

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(teamId))
      return data as Player[]
    },
    enabled: Boolean(teamId),
  })

  React.useEffect(() => {
    setPlayerId('')
  }, [teamId])

  const mutation = useMutation({
    mutationFn: () =>
      api.post(API.disciplinary.create(championshipId), {
        playerId,
        teamId,
        reason,
        matchesToServe,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspensions', championshipId] })
      onSuccess()
      handleClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao criar suspensão.'
      setError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  function handleClose() {
    setTeamId('')
    setPlayerId('')
    setReason('')
    setMatchesToServe(1)
    setNotes('')
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId) { setError('Selecione um jogador.'); return }
    if (!reason.trim()) { setError('Informe o motivo.'); return }
    setError(null)
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Suspensão Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="suspTeam">Time</Label>
            <select
              id="suspTeam"
              value={teamId}
              onChange={(e) => setTeamId((e.target as HTMLSelectElement).value)}
              className={SELECT_CLASS}
            >
              <option value="">Selecionar time...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.acronym ? ` (${t.acronym})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suspPlayer">Jogador</Label>
            <select
              id="suspPlayer"
              value={playerId}
              onChange={(e) => setPlayerId((e.target as HTMLSelectElement).value)}
              className={SELECT_CLASS}
              disabled={!teamId}
            >
              <option value="">Selecionar jogador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suspReason">Motivo</Label>
            <Input
              id="suspReason"
              placeholder="ex: Comportamento antidesportivo"
              value={reason}
              onChange={(e) => setReason((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suspMatches">Jogos de suspensão</Label>
            <Input
              id="suspMatches"
              type="number"
              min={1}
              max={99}
              value={matchesToServe}
              onChange={(e) =>
                setMatchesToServe(
                  Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1),
                )
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suspNotes">Observações (opcional)</Label>
            <Input
              id="suspNotes"
              placeholder="Notas adicionais..."
              value={notes}
              onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Criar Suspensão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
