'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import {
  Printer, CreditCard, Users, CheckSquare, Square,
  Loader2, UserX, X, Shirt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string
  name: string
  acronym: string | null
  city: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

interface Player {
  id: string
  teamId: string
  fullName: string
  photoUrl: string | null
  birthdate: string | null
  document: string | null
  documentType: string | null
  jerseyNumber: number | null
  preferredFoot: string | null
  mainPosition: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch {
    return '—'
  }
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

// ── ID Card Component (preview) ───────────────────────────────────────────────

function PlayerIdCard({
  player,
  team,
  orgName,
}: {
  player: Player
  team: Team
  orgName: string
}) {
  const primary = team.primaryColor ?? '#1a7a00'
  const secondary = team.secondaryColor ?? '#ffffff'
  const textOnPrimary = contrastColor(primary)
  const textOnSecondary = contrastColor(secondary)

  return (
    <div
      style={{
        width: '340px',
        height: '210px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '\'DM Sans\', sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Top bar */}
      <div style={{ background: primary, height: '6px', flexShrink: 0 }} />

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: '0', overflow: 'hidden' }}>
        {/* Left panel */}
        <div
          style={{
            background: primary,
            width: '110px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 8px',
            position: 'relative',
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: secondary,
              border: `3px solid ${secondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              color: textOnSecondary,
              letterSpacing: '-0.5px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {player.photoUrl
              ? <img src={player.photoUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(player.fullName)
            }
          </div>

          {/* Jersey number badge */}
          {player.jerseyNumber != null && (
            <div
              style={{
                background: secondary,
                color: textOnSecondary,
                borderRadius: '20px',
                padding: '2px 10px',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '0.5px',
              }}
            >
              #{player.jerseyNumber}
            </div>
          )}

          {/* Org name */}
          <span
            style={{
              color: textOnPrimary,
              opacity: 0.7,
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center',
              lineHeight: 1.2,
              position: 'absolute',
              bottom: '10px',
            }}
          >
            {team.acronym ?? team.name.slice(0, 8)}
          </span>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            padding: '14px 14px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Player name + position */}
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {player.fullName}
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: primary,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginTop: '4px',
              }}
            >
              {player.mainPosition}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {player.document && (
              <Row
                label={player.documentType?.toUpperCase() ?? 'DOC'}
                value={player.document}
              />
            )}
            {player.birthdate && (
              <Row label="Nasc." value={formatDate(player.birthdate)} />
            )}
            {player.preferredFoot && (
              <Row
                label="Pé"
                value={
                  player.preferredFoot === 'direito'
                    ? 'Direito'
                    : player.preferredFoot === 'esquerdo'
                    ? 'Esquerdo'
                    : 'Ambidestro'
                }
              />
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '8px',
            }}
          >
            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {orgName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{ width: '8px', height: '8px', borderRadius: '2px', background: primary }}
              />
              <span
                style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}
              >
                Cerrados Esportes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: primary, height: '4px', flexShrink: 0 }} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
      <span style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '32px', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ color: '#334155', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ── Print logic ───────────────────────────────────────────────────────────────

function buildCardHTML(player: Player, team: Team, orgName: string): string {
  const primary = team.primaryColor ?? '#1a7a00'
  const secondary = team.secondaryColor ?? '#ffffff'
  const textOnPrimary = contrastColor(primary)
  const textOnSecondary = contrastColor(secondary)

  const initials = player.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const foot =
    player.preferredFoot === 'direito'
      ? 'Direito'
      : player.preferredFoot === 'esquerdo'
      ? 'Esquerdo'
      : player.preferredFoot === 'ambidestro'
      ? 'Ambidestro'
      : ''

  const rows = [
    player.document ? `<div class="row"><span class="lbl">${player.documentType?.toUpperCase() ?? 'DOC'}</span><span>${player.document}</span></div>` : '',
    player.birthdate ? `<div class="row"><span class="lbl">Nasc.</span><span>${formatDate(player.birthdate)}</span></div>` : '',
    foot ? `<div class="row"><span class="lbl">Pé</span><span>${foot}</span></div>` : '',
  ].join('')

  return `
    <div class="card">
      <div class="top-bar" style="background:${primary}"></div>
      <div class="body">
        <div class="left" style="background:${primary}">
          <div class="avatar" style="background:${secondary};color:${textOnSecondary}">${player.photoUrl ? `<img src="${player.photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : initials}</div>
          ${player.jerseyNumber != null ? `<div class="number" style="background:${secondary};color:${textOnSecondary}">#${player.jerseyNumber}</div>` : ''}
          <span class="team-name" style="color:${textOnPrimary}">${team.acronym ?? team.name.slice(0, 8)}</span>
        </div>
        <div class="right">
          <div class="info-top">
            <div class="player-name">${player.fullName}</div>
            <div class="position" style="color:${primary}">${player.mainPosition}</div>
          </div>
          <div class="details">${rows}</div>
          <div class="footer">
            <span class="org">${orgName}</span>
            <div class="brand">
              <div class="brand-dot" style="background:${primary}"></div>
              <span>CERRADOS ESPORTES</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-bar" style="background:${primary}"></div>
    </div>
  `
}

function openPrintWindow(players: Player[], team: Team, orgName: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Por favor, permita popups para imprimir as carteirinhas.')
    return
  }

  const cardsHTML = players.map((p) => buildCardHTML(p, team, orgName)).join('')

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Carteirinhas — ${team.name}</title>
  <style>
    @page { margin: 10mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; }
    .header { padding: 8mm 10mm 4mm; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0; }
    .header h1 { font-size: 14px; font-weight: 700; color: #0f172a; }
    .header p { font-size: 11px; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(2, 340px); gap: 8mm; padding: 8mm 10mm; justify-content: center; }
    .card { width: 340px; height: 210px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); background: #fff; display: flex; flex-direction: column; page-break-inside: avoid; }
    .top-bar { height: 6px; flex-shrink: 0; }
    .body { flex: 1; display: flex; overflow: hidden; }
    .left { width: 110px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px 8px; position: relative; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; border: 3px solid rgba(255,255,255,0.4); }
    .number { border-radius: 20px; padding: 2px 10px; font-weight: 800; font-size: 13px; }
    .team-name { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; text-align: center; line-height: 1.2; position: absolute; bottom: 10px; opacity: 0.75; }
    .right { flex: 1; padding: 14px 14px 10px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .player-name { font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.2; word-break: break-word; }
    .position { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }
    .details { display: flex; flex-direction: column; gap: 3px; }
    .row { display: flex; align-items: center; gap: 6px; font-size: 10px; }
    .lbl { color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; min-width: 32px; font-weight: 600; }
    .footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 8px; }
    .org { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .brand { display: flex; align-items: center; gap: 4px; }
    .brand-dot { width: 8px; height: 8px; border-radius: 2px; }
    .brand span { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }
    .bottom-bar { height: 4px; flex-shrink: 0; }
    @media print {
      body { background: white; }
      .header { display: none; }
      .grid { padding: 0; gap: 6mm; }
      .card { box-shadow: none; border-color: #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Carteirinhas — ${team.name}</h1>
      <p>${players.length} jogador${players.length !== 1 ? 'es' : ''} · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
  </div>
  <div class="grid">${cardsHTML}</div>
  <script>window.addEventListener('load', () => { window.print() })</script>
</body>
</html>`)
  win.document.close()
}

// ── Print Preview Dialog ──────────────────────────────────────────────────────

function PrintPreviewDialog({
  players,
  team,
  orgName,
  onClose,
}: {
  players: Player[]
  team: Team
  orgName: string
  onClose: () => void
}) {
  function handlePrint() {
    openPrintWindow(players, team, orgName)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-primary" />
          <div>
            <p className="font-display font-bold">
              Pré-visualização — {team.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {players.length} carteirinha{players.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            Imprimir / Salvar PDF
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-5 justify-center">
          {players.map((player) => (
            <PlayerIdCard
              key={player.id}
              player={player}
              team={team}
              orgName={orgName}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IdCardsPage() {
  const params = useParams()
  const tenant = params.tenant as string

  const [selectedTeamId, setSelectedTeamId] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [printPlayers, setPrintPlayers] = React.useState<Player[] | null>(null)

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
  })

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['players', selectedTeamId],
    queryFn: async () => {
      const { data } = await api.get(API.teams.players(selectedTeamId))
      return data as Player[]
    },
    enabled: !!selectedTeamId,
  })

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(players.map((p) => p.id)))
    }
  }

  function openPreview(targetPlayers: Player[]) {
    setPrintPlayers(targetPlayers)
  }

  const allSelected = players.length > 0 && selectedIds.size === players.length
  const someSelected = selectedIds.size > 0
  const selectedPlayers = players.filter((p) => selectedIds.has(p.id))

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Carteirinhas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gere e imprima carteirinhas de identificação dos jogadores.
            </p>
          </div>
        </div>

        {/* Team selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              1. Selecione o Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando times...
              </div>
            ) : teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum time cadastrado.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => {
                  const isSelected = team.id === selectedTeamId
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(team.id)
                        setSelectedIds(new Set())
                      }}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/40 hover:bg-accent/30'
                      }`}
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: team.primaryColor ?? '#1a7a00' }}
                      >
                        {team.acronym ?? getInitials(team.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{team.name}</p>
                        {team.city && (
                          <p className="truncate text-xs text-muted-foreground">{team.city}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players list */}
        {selectedTeam && (
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  2. Jogadores de {selectedTeam.name}
                </CardTitle>
                {players.length > 0 && (
                  <div className="flex items-center gap-2">
                    {someSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => openPreview(selectedPlayers)}
                      >
                        <CreditCard className="size-3.5" />
                        Gerar selecionados ({selectedIds.size})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openPreview(players)}
                    >
                      <Users className="size-3.5" />
                      Gerar todos ({players.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {playersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : players.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <UserX className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum jogador cadastrado neste time.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select all row */}
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      {allSelected ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4 text-muted-foreground" />
                      )}
                      Selecionar todos
                    </button>
                    {someSelected && (
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Player rows */}
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {players.map((player) => {
                      const checked = selectedIds.has(player.id)
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-3 px-3 py-3 transition-colors ${checked ? 'bg-primary/3' : 'hover:bg-accent/30'}`}
                        >
                          <button
                            type="button"
                            onClick={() => togglePlayer(player.id)}
                            className="shrink-0"
                          >
                            {checked ? (
                              <CheckSquare className="size-4 text-primary" />
                            ) : (
                              <Square className="size-4 text-muted-foreground" />
                            )}
                          </button>

                          {/* Avatar */}
                          <div
                            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: selectedTeam.primaryColor ?? '#1a7a00' }}
                          >
                            {player.photoUrl
                              ? <img src={player.photoUrl} alt={player.fullName} className="size-full object-cover" />
                              : getInitials(player.fullName)
                            }
                          </div>

                          {/* Name + position */}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{player.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">{player.mainPosition}</p>
                          </div>

                          {/* Jersey */}
                          {player.jerseyNumber != null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Shirt className="size-3" />
                              #{player.jerseyNumber}
                            </div>
                          )}

                          {/* Individual print */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => openPreview([player])}
                          >
                            <CreditCard className="size-3.5" />
                            Gerar
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Preview */}
      {printPlayers && selectedTeam && (
        <PrintPreviewDialog
          players={printPlayers}
          team={selectedTeam}
          orgName={tenant}
          onClose={() => setPrintPlayers(null)}
        />
      )}
    </>
  )
}
