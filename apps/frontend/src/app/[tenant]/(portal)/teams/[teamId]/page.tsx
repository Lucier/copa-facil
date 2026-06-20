import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MapPin, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getInitials, formatDate } from '@/lib/utils'

export const revalidate = 60

interface Props {
  params: Promise<{ tenant: string; teamId: string }>
}

const TEAMS_DATA: Record<string, {
  id: string; name: string; city: string; championships: number
  players: Array<{ id: string; name: string; position: string; number: number; goals: number; apps: number }>
  recentResults: Array<{ opponent: string; homeAway: 'H' | 'A'; goalsFor: number; goalsAgainst: number; date: string }>
}> = {
  '1': {
    id: '1', name: 'Rápidos FC', city: 'São Paulo', championships: 2,
    players: [
      { id: 'p1', name: 'Lucas Pereira', position: 'Goleiro', number: 1, goals: 0, apps: 8 },
      { id: 'p2', name: 'Diego Silva', position: 'Defensor', number: 4, goals: 1, apps: 6 },
      { id: 'p3', name: 'Rafael Lima', position: 'Meio-Campo', number: 8, goals: 3, apps: 8 },
      { id: 'p4', name: 'Carlos Mendes', position: 'Atacante', number: 9, goals: 12, apps: 8 },
      { id: 'p5', name: 'Pedro Santos', position: 'Atacante', number: 11, goals: 4, apps: 7 },
    ],
    recentResults: [
      { opponent: 'Unidos SC', homeAway: 'H', goalsFor: 3, goalsAgainst: 1, date: '2026-06-08' },
      { opponent: 'Falcões EC', homeAway: 'A', goalsFor: 2, goalsAgainst: 0, date: '2026-05-31' },
      { opponent: 'Estrela Azul', homeAway: 'H', goalsFor: 1, goalsAgainst: 1, date: '2026-05-24' },
      { opponent: 'Guerreiros', homeAway: 'A', goalsFor: 4, goalsAgainst: 0, date: '2026-05-17' },
    ],
  },
  '2': {
    id: '2', name: 'Unidos SC', city: 'Santo André', championships: 1,
    players: [
      { id: 'p1', name: 'Fernando Costa', position: 'Goleiro', number: 1, goals: 0, apps: 8 },
      { id: 'p2', name: 'Rafael Costa', position: 'Meio-Campo', number: 10, goals: 7, apps: 8 },
      { id: 'p3', name: 'Marcos Oliveira', position: 'Defensor', number: 5, goals: 0, apps: 8 },
    ],
    recentResults: [
      { opponent: 'Rápidos FC', homeAway: 'A', goalsFor: 1, goalsAgainst: 3, date: '2026-06-08' },
      { opponent: 'Leões do Norte', homeAway: 'H', goalsFor: 2, goalsAgainst: 1, date: '2026-05-31' },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(TEAMS_DATA).map((teamId) => ({ teamId }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params
  const team = TEAMS_DATA[teamId]
  if (!team) return { title: 'Time não encontrado' }
  return {
    title: team.name,
    description: `Elenco, resultados e estatísticas do ${team.name}.`,
    openGraph: { title: `${team.name} — Perfil do Time` },
  }
}

export default async function TeamProfilePage({ params }: Props) {
  const { tenant, teamId } = await params
  const team = TEAMS_DATA[teamId]
  if (!team) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <Link href={`/${tenant}/teams`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="size-4" /> Todos os times
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          <AvatarFallback className="text-2xl">{getInitials(team.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-3xl font-bold">{team.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{team.city}</span>
            <span className="flex items-center gap-1"><Trophy className="size-3.5 text-primary" />{team.championships} títulos</span>
            <span className="flex items-center gap-1"><Users className="size-3.5" />{team.players.length} jogadores</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Roster */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Elenco</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Jogos</TableHead>
                  <TableHead className="text-right">Gols</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-display font-bold text-muted-foreground">{p.number}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.position}</TableCell>
                    <TableCell className="text-sm">{p.apps}</TableCell>
                    <TableCell className="text-right font-display font-bold text-primary">{p.goals || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Últimos Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {team.recentResults.map((r, i) => {
              const won = r.goalsFor > r.goalsAgainst
              const drew = r.goalsFor === r.goalsAgainst
              const result = won ? 'V' : drew ? 'E' : 'D'
              const color = won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400'
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
                  <span className={`font-display text-sm font-bold ${color}`}>{result}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.homeAway === 'H' ? 'vs ' : 'em '}{r.opponent}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <span className="font-display font-bold text-sm">
                    {r.homeAway === 'H'
                      ? `${r.goalsFor}–${r.goalsAgainst}`
                      : `${r.goalsAgainst}–${r.goalsFor}`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
