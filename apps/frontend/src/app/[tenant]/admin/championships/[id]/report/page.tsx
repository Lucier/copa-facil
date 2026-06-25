'use client'
import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, Printer, Download, Loader2,
  Trophy, BarChart3, Shield, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api from '@/services/api'
import { API } from '@/services/endpoints'

/* ─────────────── types ─────────────── */

interface StandingWithTeam {
  id: string
  groupId: string | null
  teamId: string
  teamName: string | null
  teamAcronym: string | null
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  yellowCards: number
  redCards: number
  fairPlayPoints: number
}

interface PlayerStatWithName {
  id: string
  teamId: string
  teamName: string | null
  playerId: string
  playerName: string | null
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

interface MatchAdmin {
  id: string
  status: string
  homeTeamName: string | null
  homeTeamAcronym: string | null
  awayTeamName: string | null
  awayTeamAcronym: string | null
  homeScore: number
  awayScore: number
  roundName: string
  roundNumber: number
  scheduledAt: string | null
  groupId: string | null
  isBye: boolean
}

interface Championship {
  id: string
  name: string
  season: string
  status: string
}

interface ChampionshipReport {
  matches: MatchAdmin[]
  standings: StandingWithTeam[]
  topScorers: PlayerStatWithName[]
  topAssisters: PlayerStatWithName[]
  disciplinary: PlayerStatWithName[]
}

/* ─────────────── helpers ─────────────── */

function teamLabel(name: string | null, acronym: string | null) {
  return name ?? acronym ?? 'A definir'
}

function downloadCsv(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ─────────────── page ─────────────── */

export default function ChampionshipReportPage() {
  const { tenant, id: championshipId } = useParams<{ tenant: string; id: string }>()

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data } = await api.get(API.championships.base)
      return data as Championship[]
    },
  })

  const championship = championships.find((c) => c.id === championshipId) ?? null

  const { data: report, isLoading, isError } = useQuery<ChampionshipReport>({
    queryKey: ['championship-report', championshipId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.report(championshipId))
      return data as ChampionshipReport
    },
    enabled: Boolean(championshipId),
  })

  function exportStandingsCsv() {
    if (!report) return
    downloadCsv(
      `classificacao-${championshipId}.csv`,
      report.standings.map((s) => [
        teamLabel(s.teamName, s.teamAcronym),
        String(s.matchesPlayed),
        String(s.wins),
        String(s.draws),
        String(s.losses),
        String(s.goalsFor),
        String(s.goalsAgainst),
        String(s.goalDifference),
        String(s.points),
      ]),
      ['Time', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', 'Pts'],
    )
  }

  function exportScorersCsv() {
    if (!report) return
    downloadCsv(
      `artilharia-${championshipId}.csv`,
      report.topScorers.map((s) => [
        s.playerName ?? s.playerId,
        teamLabel(s.teamName, null),
        String(s.goals),
        String(s.assists),
        String(s.yellowCards),
        String(s.redCards),
      ]),
      ['Jogador', 'Time', 'Gols', 'Assistências', 'Amarelos', 'Vermelhos'],
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !report) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-destructive text-sm">
        Erro ao carregar relatório.
      </div>
    )
  }

  const finishedMatches = report.matches.filter((m) => m.status === 'finished' && !m.isBye)
  const roundGroups = React.useMemo(() => {
    const map = new Map<string, { roundNumber: number; roundName: string; matches: MatchAdmin[] }>()
    for (const m of finishedMatches) {
      const key = m.roundName
      if (!map.has(key)) map.set(key, { roundNumber: m.roundNumber, roundName: m.roundName, matches: [] })
      map.get(key)!.matches.push(m)
    }
    return Array.from(map.values()).sort((a, b) => a.roundNumber - b.roundNumber)
  }, [finishedMatches])

  const groupIds = [...new Set(report.standings.map((s) => s.groupId))]

  return (
    <div className="space-y-6">

      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden">
        <Link
          href={`/${tenant}/admin/matches`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" /> Partidas
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Relatório do Campeonato
          </h1>
          {championship && (
            <p className="mt-1 text-sm text-muted-foreground">
              {championship.name} · {championship.season}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportStandingsCsv}>
            <Download className="size-3.5" />
            Classificação CSV
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportScorersCsv}>
            <Download className="size-3.5" />
            Artilharia CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Standings */}
      {report.standings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Trophy className="size-4" />
              Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupIds.map((gid) => {
              const group = report.standings.filter((s) => s.groupId === gid)
              return (
                <div key={gid ?? 'main'} className="mb-0">
                  {gid && (
                    <p className="border-b border-border/40 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Grupo {gid.slice(-4)}
                    </p>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">Time</th>
                        <th className="px-2 py-2 text-center font-medium">J</th>
                        <th className="px-2 py-2 text-center font-medium">V</th>
                        <th className="px-2 py-2 text-center font-medium">E</th>
                        <th className="px-2 py-2 text-center font-medium">D</th>
                        <th className="px-2 py-2 text-center font-medium">GP</th>
                        <th className="px-2 py-2 text-center font-medium">GC</th>
                        <th className="px-2 py-2 text-center font-medium">SG</th>
                        <th className="px-2 py-2 text-center font-medium text-primary">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((s, i) => (
                        <tr key={s.id} className="border-b border-border/40 hover:bg-accent/20">
                          <td className="flex items-center gap-2 px-4 py-2.5 font-medium">
                            <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                            {teamLabel(s.teamName, s.teamAcronym)}
                          </td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.matchesPlayed}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.wins}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.draws}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.losses}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.goalsFor}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground">{s.goalsAgainst}</td>
                          <td className={`px-2 py-2.5 text-center font-medium ${s.goalDifference > 0 ? 'text-emerald-400' : s.goalDifference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                          </td>
                          <td className="px-2 py-2.5 text-center font-display text-base font-bold text-primary">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {roundGroups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Shield className="size-4" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roundGroups.map((rg) => (
              <div key={rg.roundName}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {rg.roundName}
                </p>
                <div className="space-y-1">
                  {rg.matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="flex-1 text-right font-medium">
                        {teamLabel(m.homeTeamName, m.homeTeamAcronym)}
                      </span>
                      <span className="mx-4 font-display font-bold tabular-nums">
                        {m.homeScore} – {m.awayScore}
                      </span>
                      <span className="flex-1 font-medium">
                        {teamLabel(m.awayTeamName, m.awayTeamAcronym)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scorers + Assisters */}
      <div className="grid gap-4 sm:grid-cols-2">
        {report.topScorers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <BarChart3 className="size-4" />
                Artilharia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {report.topScorers.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium">{s.playerName ?? '—'}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">{teamLabel(s.teamName, null)}</td>
                      <td className="px-4 py-2 text-right font-display font-bold text-primary">{s.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {report.topAssisters.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <BarChart3 className="size-4" />
                Assistências
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {report.topAssisters.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium">{s.playerName ?? '—'}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">{teamLabel(s.teamName, null)}</td>
                      <td className="px-4 py-2 text-right font-display font-bold text-primary">{s.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Disciplinary */}
      {report.disciplinary.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <AlertTriangle className="size-4" />
              Disciplinar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Jogador</th>
                  <th className="px-2 py-2 text-left font-medium">Time</th>
                  <th className="px-3 py-2 text-center font-medium">🟨</th>
                  <th className="px-3 py-2 text-center font-medium">🟥</th>
                </tr>
              </thead>
              <tbody>
                {report.disciplinary.map((s) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2 font-medium">{s.playerName ?? '—'}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{teamLabel(s.teamName, null)}</td>
                    <td className="px-3 py-2 text-center">
                      {s.yellowCards > 0 && (
                        <Badge variant="warning" className="text-xs">{s.yellowCards}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {s.redCards > 0 && (
                        <Badge variant="destructive" className="text-xs">{s.redCards}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
