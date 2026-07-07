'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PlayerDialog } from '@/components/admin/PlayerDialog'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const FOOT_LABELS: Record<string, string> = {
  direito: 'Direito',
  esquerdo: 'Esquerdo',
  ambidestro: 'Ambidestro',
}

interface Team {
  id: string
  name: string
  acronym: string | null
  primaryColor: string | null
}

interface Player {
  id: string
  teamId: string
  fullName: string
  photoUrl: string | null
  birthdate: string | null
  document: string | null
  documentType: string
  jerseyNumber: number | null
  preferredFoot: string
  mainPosition: string
  subPositions: string[]
  goals: number
  yellowCards: number
  redCards: number
}

export default function PlayersPage() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>('')
  const [playerToDelete, setPlayerToDelete] = React.useState<Player | null>(null)

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
  })

  React.useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id)
    }
  }, [teams, selectedTeamId])

  const { data: players = [], isLoading, isError } = useQuery<Player[]>({
    queryKey: ['players', selectedTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(selectedTeamId))
      return data as Player[]
    },
    enabled: Boolean(selectedTeamId),
  })

  const deleteMutation = useMutation({
    mutationFn: (player: Player) => api.delete(API.teams.playerById(player.teamId, player.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', selectedTeamId] })
      setPlayerToDelete(null)
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['players', selectedTeamId] })
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Jogadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastro e estatísticas individuais dos atletas.</p>
        </div>
        {selectedTeamId && (
          <PlayerDialog teamId={selectedTeamId} onSuccess={handleSuccess}>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Adicionar Jogador
            </Button>
          </PlayerDialog>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Time:</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.acronym ? `${t.name} (${t.acronym})` : t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Jogadores no Time', value: players.length, icon: Users, color: 'text-primary' },
          { label: 'Total de Gols', value: players.reduce((s, p) => s + p.goals, 0), icon: Target, color: 'text-amber-400' },
          { label: 'Cartões Vermelhos', value: players.reduce((s, p) => s + p.redCards, 0), icon: Target, color: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`size-8 ${s.color}`} />
              <div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {selectedTeam ? `Elenco — ${selectedTeam.name}` : 'Elenco'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedTeamId && (
            <p className="p-6 text-center text-sm text-muted-foreground">Selecione um time acima.</p>
          )}
          {selectedTeamId && isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {selectedTeamId && isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar jogadores.</p>
          )}
          {selectedTeamId && !isLoading && !isError && players.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum jogador cadastrado neste time.</p>
          )}
          {selectedTeamId && !isLoading && players.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Foto</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Pé</TableHead>
                  <TableHead className="text-center">Gols</TableHead>
                  <TableHead className="text-center">CA</TableHead>
                  <TableHead className="text-center">CV</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Avatar className="size-8">
                        {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.fullName} className="object-cover" />}
                        {!player.photoUrl && selectedTeam?.primaryColor
                          ? <div className="flex size-full items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: selectedTeam.primaryColor }}>{getInitials(player.fullName)}</div>
                          : <AvatarFallback className="text-[9px]">{getInitials(player.fullName)}</AvatarFallback>}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{player.fullName}</span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {player.jerseyNumber ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{player.mainPosition}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {FOOT_LABELS[player.preferredFoot] ?? player.preferredFoot}
                    </TableCell>
                    <TableCell className="text-center font-display font-bold text-sm text-primary">
                      {player.goals}
                    </TableCell>
                    <TableCell className="text-center text-sm text-amber-400">{player.yellowCards}</TableCell>
                    <TableCell className="text-center text-sm text-red-400">
                      {player.redCards || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PlayerDialog teamId={selectedTeamId} player={player} onSuccess={handleSuccess}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </PlayerDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setPlayerToDelete(player)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(playerToDelete)} onOpenChange={(open) => { if (!open) setPlayerToDelete(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover jogador?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita.{' '}
            <strong className="text-foreground">{playerToDelete?.fullName}</strong> será removido do elenco.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setPlayerToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => playerToDelete && deleteMutation.mutate(playerToDelete)}
              disabled={deleteMutation.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
