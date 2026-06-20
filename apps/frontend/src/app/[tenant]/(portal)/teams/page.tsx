import type { Metadata } from 'next'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export const revalidate = 60

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Times',
    description: 'Diretório de todos os times participantes dos campeonatos.',
    openGraph: { title: 'Times Participantes' },
  }
}

const TEAMS = [
  { id: '1', name: 'Rápidos FC', city: 'São Paulo', wins: 18, losses: 4, draws: 2, championships: 2 },
  { id: '2', name: 'Unidos SC', city: 'Santo André', wins: 14, losses: 8, draws: 2, championships: 1 },
  { id: '3', name: 'Estrela Azul', city: 'Osasco', wins: 10, losses: 9, draws: 5, championships: 2 },
  { id: '4', name: 'Leões do Norte', city: 'Guarulhos', wins: 9, losses: 11, draws: 4, championships: 1 },
  { id: '5', name: 'Tornado FC', city: 'Campinas', wins: 12, losses: 7, draws: 5, championships: 2 },
  { id: '6', name: 'Guerreiros', city: 'São Bernardo', wins: 6, losses: 14, draws: 4, championships: 1 },
  { id: '7', name: 'Sport Clube', city: 'Sorocaba', wins: 8, losses: 9, draws: 7, championships: 1 },
  { id: '8', name: 'Falcões EC', city: 'Jundiaí', wins: 5, losses: 12, draws: 7, championships: 1 },
]

export default async function TeamsPublicPage({ params }: Props) {
  const { tenant } = await params

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Times</h1>
        <p className="mt-2 text-muted-foreground">Conheça todos os times participantes dos campeonatos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAMS.map((team) => (
          <Link key={team.id} href={`/${tenant}/teams/${team.id}`}>
            <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
              <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                <Avatar className="size-14">
                  <AvatarFallback className="text-base">{getInitials(team.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-display font-bold group-hover:text-primary transition-colors">{team.name}</h2>
                  <p className="text-xs text-muted-foreground">{team.city}</p>
                </div>
                <div className="flex w-full items-center justify-around border-t border-border/40 pt-3 text-xs">
                  <div className="text-center">
                    <p className="font-display font-bold text-emerald-400">{team.wins}</p>
                    <p className="text-muted-foreground">V</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-amber-400">{team.draws}</p>
                    <p className="text-muted-foreground">E</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-red-400">{team.losses}</p>
                    <p className="text-muted-foreground">D</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-primary">{team.championships}</p>
                    <p className="text-muted-foreground">Títulos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
