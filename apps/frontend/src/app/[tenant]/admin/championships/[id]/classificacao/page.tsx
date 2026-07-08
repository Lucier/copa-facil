'use client'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2, Trophy, Pencil, Check, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import api from '@/services/api'
import { API } from '@/services/endpoints'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface FullStandingRow {
  team_id: string
  team_name: string
  team_acronym: string | null
  team_logo_url: string | null
  group_id: string | null
  standing_id: string | null
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  extra_points: number
}

interface Championship { id: string; name: string; season: string }

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function aproveitamento(points: number, played: number): string {
  if (played === 0) return '—'
  return ((points / (played * 3)) * 100).toFixed(1) + '%'
}

/* ─── PE inline editor ───────────────────────────────────────────────────── */

function PECell({
  row, champId, onSaved,
}: {
  row: FullStandingRow; champId: string; onSaved: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(String(row.extra_points))
  const [saving, setSaving] = React.useState(false)

  if (!row.standing_id) {
    return <span className="block text-center text-muted-foreground text-sm">—</span>
  }

  async function handleSave() {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) { setEditing(false); setValue(String(row.extra_points)); return }
    setSaving(true)
    try {
      await api.patch(API.standings.extraPoints(champId, row.team_id), { extraPoints: parsed })
      onSaved()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setValue(String(row.extra_points))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <Input
          className="h-7 w-16 text-center text-xs px-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          autoFocus
        />
        {saving
          ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          : <>
              <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400"><Check className="size-3.5" /></button>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
            </>
        }
      </div>
    )
  }

  const v = row.extra_points
  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center justify-center gap-1 w-full"
      title="Clique para editar PE"
    >
      <span className={v > 0 ? 'text-emerald-400 font-semibold' : v < 0 ? 'text-red-400 font-semibold' : 'text-muted-foreground'}>
        {v > 0 ? `+${v}` : v === 0 ? '—' : v}
      </span>
      <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

/* ─── Standings table ────────────────────────────────────────────────────── */

function StandingsTable({
  rows, champId, onRefresh,
}: {
  rows: FullStandingRow[]
  champId: string
  onRefresh: () => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-xs">
          <TableHead className="w-8 text-center">#</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-center font-bold text-primary w-10">P</TableHead>
          <TableHead className="text-center w-10">J</TableHead>
          <TableHead className="text-center w-10">V</TableHead>
          <TableHead className="text-center w-10">E</TableHead>
          <TableHead className="text-center w-10">D</TableHead>
          <TableHead className="text-center w-10">GP</TableHead>
          <TableHead className="text-center w-10">GC</TableHead>
          <TableHead className="text-center w-10">SG</TableHead>
          <TableHead className="text-center w-16">%</TableHead>
          <TableHead className="text-center w-20" title="Pontos Extras/Penalidades — clique para editar">
            PE ✎
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={row.team_id}>
            <TableCell className="text-center">
              <span className={`inline-flex size-6 items-center justify-center rounded text-[11px] font-bold
                ${idx < 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                {idx + 1}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {row.team_logo_url
                  ? <div className="relative size-6 shrink-0"><Image src={row.team_logo_url} alt={row.team_name} fill className="rounded object-cover" sizes="24px" /></div>
                  : <div className="size-6 rounded bg-muted flex items-center justify-center shrink-0">
                      <Trophy className="size-3 text-muted-foreground" />
                    </div>
                }
                <span className="font-medium text-sm">{row.team_name}</span>
                {row.team_acronym && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">({row.team_acronym})</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center font-display text-base font-bold text-primary">{row.points}</TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">{row.matches_played}</TableCell>
            <TableCell className="text-center text-sm text-emerald-400 font-medium">{row.wins}</TableCell>
            <TableCell className="text-center text-sm text-amber-400 font-medium">{row.draws}</TableCell>
            <TableCell className="text-center text-sm text-red-400 font-medium">{row.losses}</TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">{row.goals_for}</TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">{row.goals_against}</TableCell>
            <TableCell className={`text-center text-sm font-semibold
              ${row.goal_difference > 0 ? 'text-emerald-400' : row.goal_difference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
            </TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">
              {aproveitamento(row.points, row.matches_played)}
            </TableCell>
            <TableCell>
              <PECell row={row} champId={champId} onSaved={onRefresh} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminClassificacaoPage() {
  const { tenant, id: champId } = useParams<{ tenant: string; id: string }>()
  const qc = useQueryClient()

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => { const { data } = await api.get(API.championships.base); return data },
  })
  const championship = championships.find((c) => c.id === champId) ?? null

  const { data: rows = [], isLoading } = useQuery<FullStandingRow[]>({
    queryKey: ['standings-full', champId],
    queryFn: async () => {
      const { data } = await api.get(API.standings.full(champId))
      return data
    },
    enabled: Boolean(champId),
  })

  function refresh() {
    qc.invalidateQueries({ queryKey: ['standings-full', champId] })
  }

  // Group by group_id
  const groups = React.useMemo(() => {
    const map: Record<string, FullStandingRow[]> = {}
    for (const row of rows) {
      const key = row.group_id ?? '__none__'
      ;(map[key] ??= []).push(row)
    }
    return map
  }, [rows])

  const groupKeys = Object.keys(groups)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            href={`/${tenant}/admin/championships`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" /> Campeonatos
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">Classificação</h1>
          {championship && (
            <p className="text-sm text-muted-foreground">{championship.name} · {championship.season}</p>
          )}
        </div>
        <Link href={`/${tenant}/admin/championships/${champId}/estrutura`}>
          <Button size="sm" variant="outline">Ver Estrutura</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Users className="size-10 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">Nenhum time encontrado neste campeonato.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Adicione times às partidas ou grupos na aba Estrutura para que eles apareçam aqui.
          </p>
          <Link href={`/${tenant}/admin/championships/${champId}/estrutura`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              Ir para Estrutura
            </Button>
          </Link>
        </div>
      ) : groupKeys.length === 1 && groupKeys[0] === '__none__' ? (
        <Card>
          <CardContent className="p-0 pb-1">
            <StandingsTable rows={groups['__none__']} champId={champId} onRefresh={refresh} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupKeys.map((key) => (
            <Card key={key}>
              {key !== '__none__' && (
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Grupo
                  </CardTitle>
                </CardHeader>
              )}
              <CardContent className="p-0 pb-1">
                <StandingsTable rows={groups[key]} champId={champId} onRefresh={refresh} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
          <p><strong>P</strong> = Pontos · <strong>J</strong> = Jogos · <strong>V</strong> = Vitórias · <strong>E</strong> = Empates · <strong>D</strong> = Derrotas</p>
          <p><strong>GP</strong> = Gols Pró · <strong>GC</strong> = Gols Contra · <strong>SG</strong> = Saldo de Gols · <strong>%</strong> = Aproveitamento</p>
          <p><strong>PE</strong> = Penalidades / Pontos Extras — clique no valor para editar bônus ou punições</p>
        </div>
      )}
    </div>
  )
}
