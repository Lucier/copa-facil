'use client'
import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, FolderOpen, Calendar, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'
import { API } from '@/services/endpoints'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface MatchRow {
  id: string; round_id: string
  home_team_id: string | null; away_team_id: string | null
  status: string; scheduled_at: string | null
  home_score: number; away_score: number
}
interface RoundRow { id: string; name: string; number: number; phase_id: string | null; matches: MatchRow[] }
interface PhaseRow { id: string; name: string; order_index: number; rounds: RoundRow[] }
interface Structure { phases: PhaseRow[]; unlinkedRounds: RoundRow[] }
interface Team { id: string; name: string; acronym: string | null }
interface Championship { id: string; name: string; season: string }

const STATUS_VARIANT: Record<string, string> = {
  scheduled: 'outline', live: 'live', finished: 'default', cancelled: 'destructive',
}
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado', live: 'Ao Vivo', finished: 'Encerrado', cancelled: 'Cancelado',
}

/* ─── MatchCard ──────────────────────────────────────────────────────────── */

function MatchCard({
  match, teams, champId, roundId, onDelete, onUpdate,
}: {
  match: MatchRow; teams: Team[]; champId: string; roundId: string
  onDelete: () => void; onUpdate: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [homeId, setHomeId] = React.useState(match.home_team_id ?? '')
  const [awayId, setAwayId] = React.useState(match.away_team_id ?? '')
  const [scheduledAt, setScheduledAt] = React.useState(
    match.scheduled_at ? match.scheduled_at.replace('Z', '').slice(0, 16) : '',
  )
  const [saving, setSaving] = React.useState(false)

  const teamName = (id: string | null) => {
    if (!id) return <span className="text-muted-foreground">A definir</span>
    const t = teams.find((t) => t.id === id)
    return <span>{t?.name ?? id.slice(0, 8)}</span>
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.patch(
        `/championships/${champId}/rounds/${roundId}/matches/${match.id}`,
        {
          homeTeamId: homeId || null,
          awayTeamId: awayId || null,
          scheduledAt: scheduledAt || null,
        },
      )
      setEditing(false)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta partida?')) return
    await api.delete(`/championships/${champId}/rounds/${roundId}/matches/${match.id}`)
    onDelete()
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time Mandante</label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={homeId}
              onChange={(e) => setHomeId(e.target.value)}
            >
              <option value="">A definir</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time Visitante</label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={awayId}
              onChange={(e) => setAwayId(e.target.value)}
            >
              <option value="">A definir</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data/Hora</label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin mr-1" />}
            Salvar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium truncate">{teamName(match.home_team_id)}</span>
          {match.status === 'finished'
            ? <span className="font-display font-bold tabular-nums shrink-0">{match.home_score} – {match.away_score}</span>
            : <span className="text-muted-foreground shrink-0 text-xs">vs</span>
          }
          <span className="font-medium truncate text-right">{teamName(match.away_team_id)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {match.scheduled_at && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(match.scheduled_at))}
            </span>
          )}
          <Badge variant={STATUS_VARIANT[match.status] as never} className="text-[10px] px-1 py-0">
            {STATUS_LABEL[match.status] ?? match.status}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ─── RoundBlock ─────────────────────────────────────────────────────────── */

function RoundBlock({
  round, teams, champId, onRefresh,
}: {
  round: RoundRow; teams: Team[]; champId: string; phaseId: string | null; onRefresh: () => void
}) {
  const [open, setOpen] = React.useState(true)
  const [adding, setAdding] = React.useState(false)
  const [homeId, setHomeId] = React.useState('')
  const [awayId, setAwayId] = React.useState('')
  const [scheduledAt, setScheduledAt] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function handleAddMatch() {
    setSaving(true)
    try {
      await api.post(`/championships/${champId}/rounds/${round.id}/matches`, {
        homeTeamId: homeId || null,
        awayTeamId: awayId || null,
        scheduledAt: scheduledAt || null,
      })
      setAdding(false)
      setHomeId(''); setAwayId(''); setScheduledAt('')
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRound() {
    if (!confirm(`Excluir rodada "${round.name}" e todas as suas partidas?`)) return
    await api.delete(`/championships/${champId}/rounds/${round.id}`)
    onRefresh()
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
          <span className="font-medium text-sm">{round.name}</span>
          <span className="text-xs text-muted-foreground">· {round.matches.length} partida{round.matches.length !== 1 ? 's' : ''}</span>
        </button>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs px-2" onClick={() => setAdding(!adding)}>
            <Plus className="size-3.5" /> Partida
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={handleDeleteRound}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {round.matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              teams={teams}
              champId={champId}
              roundId={round.id}
              onDelete={onRefresh}
              onUpdate={onRefresh}
            />
          ))}

          {adding && (
            <div className="rounded-lg border border-dashed border-primary/40 p-3 space-y-3">
              <p className="text-xs font-medium text-primary">Nova Partida</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time Mandante</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    value={homeId}
                    onChange={(e) => setHomeId(e.target.value)}
                  >
                    <option value="">A definir</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time Visitante</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    value={awayId}
                    onChange={(e) => setAwayId(e.target.value)}
                  >
                    <option value="">A definir</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data/Hora</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleAddMatch} disabled={saving}>
                  {saving && <Loader2 className="size-3.5 animate-spin mr-1" />}
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {round.matches.length === 0 && !adding && (
            <p className="text-xs text-muted-foreground py-2 text-center">Nenhuma partida nesta rodada.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── PhaseBlock ─────────────────────────────────────────────────────────── */

function PhaseBlock({
  phase, teams, champId, onRefresh,
}: {
  phase: PhaseRow; teams: Team[]; champId: string; onRefresh: () => void
}) {
  const [open, setOpen] = React.useState(true)
  const [addingRound, setAddingRound] = React.useState(false)
  const [roundName, setRoundName] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function handleAddRound() {
    if (!roundName.trim()) return
    setSaving(true)
    try {
      await api.post(`/championships/${champId}/rounds`, { name: roundName.trim(), phaseId: phase.id })
      setRoundName(''); setAddingRound(false)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePhase() {
    if (!confirm(`Excluir fase "${phase.name}"? As rodadas serão desvinculadas mas não excluídas.`)) return
    await api.delete(`/championships/${champId}/phases/${phase.id}`)
    onRefresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left">
            <FolderOpen className="size-4 text-primary" />
            <span className="font-display font-bold text-base">{phase.name}</span>
            <span className="text-xs text-muted-foreground">· {phase.rounds.length} rodada{phase.rounds.length !== 1 ? 's' : ''}</span>
          </button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setAddingRound(!addingRound)}>
            <Plus className="size-3.5" /> Rodada
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={handleDeletePhase}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 pt-0">
          {addingRound && (
            <div className="flex gap-2 rounded-lg border border-dashed border-primary/40 p-3">
              <Input
                placeholder="Nome da rodada (ex: Rodada 1)"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRound()}
                className="text-sm"
              />
              <Button size="sm" onClick={handleAddRound} disabled={saving || !roundName.trim()}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Criar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingRound(false); setRoundName('') }}>
                ✕
              </Button>
            </div>
          )}

          {phase.rounds.map((round) => (
            <RoundBlock
              key={round.id}
              round={round}
              teams={teams}
              champId={champId}
              phaseId={phase.id}
              onRefresh={onRefresh}
            />
          ))}

          {phase.rounds.length === 0 && !addingRound && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma rodada nesta fase. Clique em &quot;+ Rodada&quot; para começar.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function EstrutuaraPage() {
  const { tenant, id: champId } = useParams<{ tenant: string; id: string }>()
  const qc = useQueryClient()

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => { const { data } = await api.get(API.championships.base); return data },
  })
  const championship = championships.find((c) => c.id === champId) ?? null

  const { data: structure, isLoading } = useQuery<Structure>({
    queryKey: ['structure', champId],
    queryFn: async () => {
      const { data } = await api.get(API.structure.phases(champId))
      return data
    },
    enabled: Boolean(champId),
  })

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => { const { data } = await api.get(API.teams.base); return data },
  })

  const [addingPhase, setAddingPhase] = React.useState(false)
  const [phaseName, setPhaseName] = React.useState('')
  const [savingPhase, setSavingPhase] = React.useState(false)
  const [addingRound, setAddingRound] = React.useState(false)
  const [roundName, setRoundName] = React.useState('')
  const [savingRound, setSavingRound] = React.useState(false)

  function refresh() {
    qc.invalidateQueries({ queryKey: ['structure', champId] })
  }

  async function handleAddPhase() {
    if (!phaseName.trim()) return
    setSavingPhase(true)
    try {
      await api.post(API.structure.phases(champId), {
        name: phaseName.trim(),
        orderIndex: (structure?.phases.length ?? 0),
      })
      setPhaseName(''); setAddingPhase(false)
      refresh()
    } finally {
      setSavingPhase(false)
    }
  }

  async function handleAddUnlinkedRound() {
    if (!roundName.trim()) return
    setSavingRound(true)
    try {
      await api.post(API.structure.rounds(champId), { name: roundName.trim() })
      setRoundName(''); setAddingRound(false)
      refresh()
    } finally {
      setSavingRound(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 justify-between flex-wrap">
        <div>
          <Link
            href={`/${tenant}/admin/championships`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" /> Campeonatos
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
            Estrutura do Campeonato
          </h1>
          {championship && (
            <p className="text-sm text-muted-foreground">{championship.name} · {championship.season}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => { setAddingRound(!addingRound); setAddingPhase(false) }}
          >
            <Plus className="size-4" /> Rodada sem Fase
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { setAddingPhase(!addingPhase); setAddingRound(false) }}
          >
            <Plus className="size-4" /> Nova Fase
          </Button>
        </div>
      </div>

      {/* Add phase form */}
      {addingPhase && (
        <Card>
          <CardContent className="flex gap-2 p-4">
            <Input
              placeholder="Nome da fase (ex: 1ª Fase, Semifinal, Final)"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
              autoFocus
            />
            <Button onClick={handleAddPhase} disabled={savingPhase || !phaseName.trim()}>
              {savingPhase ? <Loader2 className="size-4 animate-spin" /> : 'Criar Fase'}
            </Button>
            <Button variant="ghost" onClick={() => { setAddingPhase(false); setPhaseName('') }}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add unlinked round form */}
      {addingRound && (
        <Card>
          <CardContent className="flex gap-2 p-4">
            <Input
              placeholder="Nome da rodada (ex: Rodada 1)"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnlinkedRound()}
              autoFocus
            />
            <Button onClick={handleAddUnlinkedRound} disabled={savingRound || !roundName.trim()}>
              {savingRound ? <Loader2 className="size-4 animate-spin" /> : 'Criar Rodada'}
            </Button>
            <Button variant="ghost" onClick={() => { setAddingRound(false); setRoundName('') }}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Phases */}
          {(structure?.phases ?? []).map((phase) => (
            <PhaseBlock
              key={phase.id}
              phase={phase}
              teams={teams}
              champId={champId}
              onRefresh={refresh}
            />
          ))}

          {/* Unlinked rounds */}
          {(structure?.unlinkedRounds ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Rodadas sem Fase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {(structure?.unlinkedRounds ?? []).map((round) => (
                  <RoundBlock
                    key={round.id}
                    round={round}
                    teams={teams}
                    champId={champId}
                    phaseId={null}
                    onRefresh={refresh}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {(structure?.phases ?? []).length === 0 && (structure?.unlinkedRounds ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border">
                <Users className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhuma estrutura ainda</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  Crie fases para organizar seu campeonato (ex: Fase de Grupos, Semifinal, Final)
                  e adicione rodadas com os confrontos.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setAddingPhase(true)} className="gap-1.5">
                  <Plus className="size-4" /> Nova Fase
                </Button>
                <Button variant="outline" onClick={() => setAddingRound(true)} className="gap-1.5">
                  <Plus className="size-4" /> Rodada sem Fase
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
