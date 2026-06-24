import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getInitials } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string; teamId: string }> }

interface Team {
  id: string; name: string; acronym: string | null; city: string | null
  nickname: string | null; logo_url: string | null; primary_color: string | null
}

interface Player {
  id: string; team_id: string; full_name: string; birthdate: string | null
  jersey_number: number | null; preferred_foot: string; main_position: string
  goals: number; yellow_cards: number; red_cards: number
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, teamId } = await params
  try {
    const team = await publicFetch<Team>(tenant, `teams/${teamId}`)
    return {
      title: team.name,
      description: `Elenco e estatísticas do ${team.name}.`,
      openGraph: { title: `${team.name} — Perfil do Time` },
    }
  } catch {
    return { title: 'Time não encontrado' }
  }
}

export default async function TeamProfilePage({ params }: Props) {
  const { tenant, teamId } = await params

  let team: Team | null = null
  let players: Player[] = []

  try {
    team = await publicFetch<Team>(tenant, `teams/${teamId}`)
  } catch {
    notFound()
  }

  try {
    const res = await publicFetch<Paginated<Player>>(tenant, 'players', { teamId, limit: '100' })
    players = res.data
  } catch {
    // show empty roster
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <Link
        href={`/${tenant}/teams`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" /> Todos os times
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          {team!.primary_color && (
            <div
              className="flex size-full items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: team!.primary_color }}
            >
              {team!.acronym ?? getInitials(team!.name)}
            </div>
          )}
          <AvatarFallback className="text-2xl">{getInitials(team!.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-3xl font-bold">{team!.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {team!.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />{team!.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />{players.length} jogador{players.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Roster */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Elenco</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {players.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum jogador cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Pé</TableHead>
                  <TableHead className="text-center">Gols</TableHead>
                  <TableHead className="text-center">CA</TableHead>
                  <TableHead className="text-center">CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players
                  .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-display font-bold text-muted-foreground">
                        {p.jersey_number ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.main_position}</TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">{p.preferred_foot}</TableCell>
                      <TableCell className="text-center font-display font-bold text-primary">
                        {p.goals || '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm text-amber-400">
                        {p.yellow_cards || '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm text-red-400">
                        {p.red_cards || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
