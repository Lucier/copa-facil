import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, CalendarDays, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Campeonatos',
    description: 'Todos os campeonatos e torneios organizados.',
    openGraph: { title: 'Campeonatos' },
  }
}

interface Championship {
  id: string; name: string; season: string; format: string
  legs: number; status: string; created_at: string
}

const FORMAT_LABEL: Record<string, string> = {
  pontos_corridos: 'Pontos Corridos',
  mata_mata: 'Mata-mata',
  grupos_mata_mata: 'Grupos + Mata-mata',
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  active: { label: 'Em Andamento', variant: 'success' },
  finished: { label: 'Encerrado', variant: 'default' },
  draft: { label: 'Em breve', variant: 'outline' },
}

export default async function ChampionshipsPublicPage({ params }: Props) {
  const { tenant } = await params

  let championships: Championship[] = []
  try {
    const res = await publicFetch<Paginated<Championship>>(tenant, 'championships', { limit: '50' })
    championships = res.data
  } catch {
    // show empty state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Campeonatos</h1>
        <p className="mt-2 text-muted-foreground">Todos os torneios organizados. Acompanhe fases, times e resultados.</p>
      </div>

      {championships.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Trophy className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum campeonato cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((c) => {
            const st = STATUS_MAP[c.status] ?? { label: c.status, variant: 'outline' as const }
            return (
              <Card key={c.id} className="group flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
                        <Trophy className="size-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-base leading-tight">{c.name}</h2>
                        <p className="text-xs text-muted-foreground">Temporada {c.season}</p>
                      </div>
                    </div>
                    <Badge variant={st.variant} className="shrink-0">{st.label}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{FORMAT_LABEL[c.format] ?? c.format}</span>
                      {c.legs > 1 && <span>· {c.legs} turnos</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      <span>Criado em {formatDate(c.created_at)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/${tenant}/championships/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>Ver campeonato</span>
                    <ChevronRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
