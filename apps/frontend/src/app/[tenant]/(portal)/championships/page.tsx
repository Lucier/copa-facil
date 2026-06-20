import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, CalendarDays, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Campeonatos',
    description: 'Todos os campeonatos e torneios organizados.',
    openGraph: { title: 'Campeonatos' },
  }
}

const CHAMPIONSHIPS = [
  {
    id: '1',
    name: 'Regional 2024',
    sport: 'Futebol',
    teams: 8,
    startDate: '2026-03-01',
    endDate: '2026-07-30',
    status: 'active',
    phase: 'Quartas de Final',
    description: 'Campeonato regional de futebol amador com times da grande área. Fase atual: disputas de quartas de final.',
  },
  {
    id: '2',
    name: 'Copa Cidade',
    sport: 'Futebol',
    teams: 16,
    startDate: '2026-05-01',
    endDate: '2026-09-15',
    status: 'active',
    phase: 'Fase de Grupos',
    description: 'Maior torneio da cidade com 16 times divididos em 4 grupos. Fase de grupos em andamento.',
  },
  {
    id: '3',
    name: 'Torneio de Verão',
    sport: 'Futebol Society',
    teams: 12,
    startDate: '2026-01-10',
    endDate: '2026-02-28',
    status: 'finished',
    phase: 'Encerrado',
    description: 'Torneio relâmpago de verão no formato de futebol society. Campeão: Rápidos FC.',
  },
]

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  active: { label: 'Em Andamento', variant: 'success' },
  finished: { label: 'Encerrado', variant: 'default' },
  draft: { label: 'Em breve', variant: 'outline' },
}

export default async function ChampionshipsPublicPage({ params }: Props) {
  const { tenant } = await params

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Campeonatos</h1>
        <p className="mt-2 text-muted-foreground">Todos os torneios organizados. Acompanhe fases, times e resultados.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CHAMPIONSHIPS.map((c) => {
          const st = STATUS_MAP[c.status]
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
                      <p className="text-xs text-muted-foreground">{c.sport}</p>
                    </div>
                  </div>
                  <Badge variant={st.variant} className="shrink-0">{st.label}</Badge>
                </div>

                <p className="flex-1 text-sm text-muted-foreground leading-relaxed">{c.description}</p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    <span>{c.teams} times</span>
                    <span className="text-border">·</span>
                    <span className="font-medium text-foreground/70">{c.phase}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    <span>{formatDate(c.startDate)} — {formatDate(c.endDate)}</span>
                  </div>
                </div>

                <Link
                  href={`/${tenant}/standings?championship=${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <span>Ver classificação</span>
                  <ChevronRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
