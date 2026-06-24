import type { Metadata } from 'next'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Times',
    description: 'Diretório de todos os times participantes dos campeonatos.',
    openGraph: { title: 'Times Participantes' },
  }
}

interface Team {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
}

export default async function TeamsPublicPage({ params }: Props) {
  const { tenant } = await params

  let teams: Team[] = []
  try {
    const res = await publicFetch<Paginated<Team>>(tenant, 'teams', { limit: '100' })
    teams = res.data
  } catch {
    // silently show empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Times</h1>
        <p className="mt-2 text-muted-foreground">Conheça todos os times participantes dos campeonatos.</p>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Users className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum time cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/${tenant}/teams/${team.id}`}>
              <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  <Avatar className="size-14">
                    {team.primary_color && (
                      <div
                        className="flex size-full items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: team.primary_color }}
                      >
                        {team.acronym ?? getInitials(team.name)}
                      </div>
                    )}
                    <AvatarFallback className="text-base">{getInitials(team.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display font-bold group-hover:text-primary transition-colors">{team.name}</h2>
                    {team.city && <p className="text-xs text-muted-foreground">{team.city}</p>}
                    {team.nickname && <p className="text-xs text-muted-foreground italic">{team.nickname}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
