'use client'
import * as React from 'react'
import { Loader2, Zap, GripVertical, CheckCircle2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Team {
  id: string
  name: string
  acronym: string | null
  city: string | null
  primaryColor: string | null
}

interface Championship {
  id: string
  name: string
  season: string
  format: string
  legs: number
}

interface Props {
  children: React.ReactNode
  championship: Championship
  teams: Team[]
  onSuccess?: () => void
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function GenerateFixturesDialog({ children, championship, teams, onSuccess }: Props) {
  const [open, setOpen] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [groupCount, setGroupCount] = React.useState(2)
  const [qualifiersPerGroup, setQualifiersPerGroup] = React.useState(2)
  const [loading, setLoading] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  const isGroupFormat = championship.format === 'grupos_mata_mata'

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setSelectedIds((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  async function handleGenerate() {
    if (selectedIds.length < 2) {
      setServerError('Selecione ao menos 2 times.')
      return
    }
    setServerError(null)
    setLoading(true)
    try {
      const body: Record<string, unknown> = { teamIds: selectedIds }
      if (isGroupFormat) {
        body.groupCount = groupCount
        body.qualifiersPerGroup = qualifiersPerGroup
      }
      await api.post(API.championships.fixtures(championship.id), body)
      setDone(true)
      onSuccess?.()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao gerar partidas.'
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedIds([])
      setServerError(null)
      setDone(false)
      setGroupCount(2)
      setQualifiersPerGroup(2)
    }
    setOpen(next)
  }

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Gerar Partidas — {championship.name} {championship.season}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <p className="font-semibold">Partidas geradas com sucesso!</p>
            <p className="text-sm text-muted-foreground">
              O campeonato foi ativado e a tabela de jogos está disponível.
            </p>
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Team selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Selecione os times participantes{' '}
                <span className="text-muted-foreground">({selectedIds.length} selecionados)</span>
              </p>
              <div className="max-h-48 overflow-y-auto rounded-md border border-input divide-y divide-border">
                {teams.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum time cadastrado.
                  </p>
                ) : (
                  teams.map((team) => {
                    const selected = selectedIds.includes(team.id)
                    const seed = selectedIds.indexOf(team.id) + 1
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggle(team.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${selected ? 'bg-primary/5' : ''}`}
                      >
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${selected ? 'border-primary bg-primary' : 'border-border'}`}
                        >
                          {selected && <span className="text-[9px] font-bold text-primary-foreground">{seed}</span>}
                        </div>
                        <Avatar className="size-7 shrink-0">
                          {team.primaryColor && (
                            <div
                              className="flex size-full items-center justify-center text-[9px] font-bold text-white"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              {team.acronym ?? getInitials(team.name)}
                            </div>
                          )}
                          <AvatarFallback className="text-[9px]">{getInitials(team.name)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-medium">{team.name}</span>
                        {team.city && <span className="text-xs text-muted-foreground">{team.city}</span>}
                        {selected && <Badge variant="outline" className="text-[10px] shrink-0">#{seed}</Badge>}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Seed order — only shown when teams are selected */}
            {selectedIds.length >= 2 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Ordem de cabeça de chave (arraste para reordenar)
                </p>
                <div className="rounded-md border border-input divide-y divide-border">
                  {selectedIds.map((id, index) => {
                    const team = teamMap[id]
                    if (!team) return null
                    return (
                      <div key={id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <GripVertical className="size-3.5 text-muted-foreground" />
                        <span className="flex-1 font-medium">{team.name}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(index)}
                            disabled={index === selectedIds.length - 1}
                            className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Group format options */}
            {isGroupFormat && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Número de grupos</label>
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    value={groupCount}
                    onChange={(e) => setGroupCount(Number((e.target as HTMLInputElement).value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Classificados por grupo</label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={qualifiersPerGroup}
                    onChange={(e) => setQualifiersPerGroup(Number((e.target as HTMLInputElement).value))}
                  />
                </div>
              </div>
            )}

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Formato: <strong>{championship.format === 'pontos_corridos' ? 'Pontos Corridos' : championship.format === 'mata_mata' ? 'Mata-Mata' : 'Grupos + Mata-Mata'}</strong>
              {' · '}
              {championship.legs === 1 ? 'Jogo único' : 'Ida e volta'}
              {selectedIds.length >= 2 && (
                <>
                  {' · '}
                  <strong>{selectedIds.length} times</strong>
                </>
              )}
            </div>

            {serverError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {serverError}
              </p>
            )}

            <DialogFooter className="pt-1">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || selectedIds.length < 2}
                className="gap-2"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                Gerar Partidas
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
