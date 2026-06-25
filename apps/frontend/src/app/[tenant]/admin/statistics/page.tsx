'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Calculator, BarChart3, Target, Trophy, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

interface Championship { id: string; name: string; season: string }
interface Standing {
  teamId: string; teamName: string | null; groupName: string | null
  matchesPlayed: number; wins: number; draws: number; losses: number
  goalsFor: number; goalsAgainst: number; goalDifference: number; points: number
}
interface TopScorer {
  playerId: string; playerName: string | null; teamName: string | null
  goals: number; assists: number; yellowCards: number; redCards: number
  fairPlayPoints: number
}
interface CustomRanking {
  id: string; championshipId: string; name: string
  weights: { goals: number; assists: number; yellowCardPenalty: number; redCardPenalty: number; matchesPlayed: number }
  createdAt: string
}
interface RankingEntry {
  rank: number; playerId: string; playerName: string | null; teamName: string | null
  score: number; goals: number; assists: number; yellowCards: number; redCards: number
}

function CreateRankingDialog({ championshipId, onSuccess }: { championshipId: string; onSuccess: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [weights, setWeights] = React.useState({ goals: 10, assists: 7, yellowCardPenalty: 2, redCardPenalty: 5, matchesPlayed: 1 })

  const mutation = useMutation({
    mutationFn: () => api.post(API.rankings.create(championshipId), { name, weights }),
    onSuccess: () => { setOpen(false); setName(''); onSuccess() },
  })

  function w(field: keyof typeof weights, val: string) {
    setWeights((prev) => ({ ...prev, [field]: Number(val) || 0 }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="size-4" />Novo Ranking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Criar Ranking Personalizado</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Nome</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ranking Ofensivo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['goals', 'Pontos por Gol'],
              ['assists', 'Pontos por Assistência'],
              ['yellowCardPenalty', 'Penalidade Amarelo'],
              ['redCardPenalty', 'Penalidade Vermelho'],
              ['matchesPlayed', 'Pontos por Jogo'],
            ] as [keyof typeof weights, string][]).map(([field, label]) => (
              <div key={field}>
                <Label className="text-xs">{label}</Label>
                <Input type="number" min={0} className="mt-1" value={weights[field]}
                  onChange={(e) => w(field, e.target.value)} />
              </div>
            ))}
          </div>
          <Button className="w-full" disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Salvando...' : 'Criar Ranking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StatisticsPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState<string>('')
  const [activeRankingId, setActiveRankingId] = React.useState<string | null>(null)

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => { const { data } = await api.get(API.championships.base); return data },
  })

  const { data: standings = [] } = useQuery<Standing[]>({
    queryKey: ['standings', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.standings(selectedChampId))
      return data
    },
    enabled: Boolean(selectedChampId),
  })

  const { data: topScorers = [] } = useQuery<TopScorer[]>({
    queryKey: ['top-scorers', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.championships.statistics(selectedChampId, 'top-scorers'))
      return data
    },
    enabled: Boolean(selectedChampId),
  })

  const { data: rankings = [] } = useQuery<CustomRanking[]>({
    queryKey: ['rankings', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.rankings.list(selectedChampId))
      return data
    },
    enabled: Boolean(selectedChampId),
  })

  const { data: rankingResult = [], isFetching: computingRanking } = useQuery<RankingEntry[]>({
    queryKey: ['ranking-compute', activeRankingId],
    queryFn: async () => {
      const ranking = rankings.find((r) => r.id === activeRankingId)!
      const { data } = await api.get(API.rankings.compute(ranking.championshipId, activeRankingId!))
      return data
    },
    enabled: Boolean(activeRankingId),
  })

  const deleteRanking = useMutation({
    mutationFn: (rankingId: string) => {
      const ranking = rankings.find((r) => r.id === rankingId)!
      return api.delete(API.rankings.delete(ranking.championshipId, rankingId))
    },
    onSuccess: () => {
      setActiveRankingId(null)
      queryClient.invalidateQueries({ queryKey: ['rankings', selectedChampId] })
    },
  })

  const champ = championships.find((c) => c.id === selectedChampId)
  const totalGoals = topScorers.reduce((s, p) => s + p.goals, 0)
  const totalYellow = topScorers.reduce((s, p) => s + p.yellowCards, 0)
  const leader = standings[0]?.teamName ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Estatísticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Classificação, artilharia e rankings personalizados.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Campeonato:</label>
        <select value={selectedChampId} onChange={(e) => { setSelectedChampId(e.target.value); setActiveRankingId(null) }} className={SELECT_CLASS}>
          <option value="">Selecione um campeonato</option>
          {championships.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
          ))}
        </select>
      </div>

      {selectedChampId && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Gols Marcados', value: String(totalGoals), icon: Target },
              { label: 'Artilheiro', value: topScorers[0]?.playerName ?? '—', icon: Trophy },
              { label: 'Cartões Amarelos', value: String(totalYellow), icon: Shield },
              { label: 'Líder da Tabela', value: leader, icon: BarChart3 },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <s.icon className="size-7 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold truncate">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Standings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Classificação — {champ?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {standings.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma classificação disponível.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Pts</TableHead>
                        <TableHead>PJ</TableHead>
                        <TableHead>V</TableHead>
                        <TableHead>E</TableHead>
                        <TableHead>D</TableHead>
                        <TableHead>SG</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((row, i) => (
                        <TableRow key={row.teamId}>
                          <TableCell>
                            <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold
                              ${i < 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{row.teamName ?? '—'}</TableCell>
                          <TableCell className="font-display font-bold text-sm">{row.points}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.matchesPlayed}</TableCell>
                          <TableCell className="text-xs text-emerald-400">{row.wins}</TableCell>
                          <TableCell className="text-xs text-amber-400">{row.draws}</TableCell>
                          <TableCell className="text-xs text-red-400">{row.losses}</TableCell>
                          <TableCell className={`text-xs font-semibold ${row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Top Scorers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Artilharia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topScorers.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhum dado de artilharia ainda.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Jogador</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Gols</TableHead>
                        <TableHead>Assist.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topScorers.slice(0, 10).map((row, i) => (
                        <TableRow key={row.playerId}>
                          <TableCell>
                            <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold
                              ${i === 0 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{row.playerName ?? '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.teamName ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={i === 0 ? 'default' : 'outline'} className="font-display font-bold">
                              {row.goals}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.assists}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Custom Rankings */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Rankings Personalizados
              </CardTitle>
              <CreateRankingDialog championshipId={selectedChampId}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rankings', selectedChampId] })} />
            </CardHeader>
            <CardContent>
              {rankings.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum ranking criado. Crie um para combinar gols, assistências e cartões com pesos personalizados.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {rankings.map((r) => (
                      <div key={r.id} className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={activeRankingId === r.id ? 'default' : 'outline'}
                          className="gap-2"
                          onClick={() => setActiveRankingId(r.id === activeRankingId ? null : r.id)}
                        >
                          <Calculator className="size-3.5" />
                          {r.name}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteRanking.mutate(r.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {activeRankingId && (
                    <div>
                      {computingRanking ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Calculando...</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8">#</TableHead>
                              <TableHead>Jogador</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                              <TableHead>Gols</TableHead>
                              <TableHead>Assist.</TableHead>
                              <TableHead>Amarelos</TableHead>
                              <TableHead>Vermelhos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankingResult.map((row) => (
                              <TableRow key={row.playerId}>
                                <TableCell>
                                  <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold
                                    ${row.rank === 1 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                                    {row.rank}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium text-sm">{row.playerName ?? '—'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{row.teamName ?? '—'}</TableCell>
                                <TableCell className="text-right font-display font-bold text-primary">{row.score}</TableCell>
                                <TableCell className="text-xs">{row.goals}</TableCell>
                                <TableCell className="text-xs">{row.assists}</TableCell>
                                <TableCell className="text-xs text-amber-400">{row.yellowCards}</TableCell>
                                <TableCell className="text-xs text-red-400">{row.redCards}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedChampId && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Selecione um campeonato para ver as estatísticas.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
