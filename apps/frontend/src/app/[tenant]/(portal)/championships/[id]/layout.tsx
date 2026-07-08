import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { publicFetch } from '@/lib/server-api'
import { Badge } from '@/components/ui/badge'
import { ChampionshipNav } from '@/components/portal/ChampionshipNav'

interface Props {
  children: React.ReactNode
  params: Promise<{ tenant: string; id: string }>
}

interface Championship {
  id: string; name: string; season: string; format: string
  legs: number; status: string; logo_url: string | null
}

const FORMAT_LABEL: Record<string, string> = {
  pontos_corridos: 'Pontos Corridos',
  mata_mata: 'Mata-mata',
  grupos_mata_mata: 'Grupos + Mata-mata',
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  active: { label: 'Em Andamento', variant: 'success' },
  finished: { label: 'Encerrado', variant: 'default' },
  draft: { label: 'Em Breve', variant: 'outline' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, id } = await params
  try {
    const c = await publicFetch<Championship>(tenant, `championships/${id}`)
    return { title: `${c.name} ${c.season}` }
  } catch {
    return { title: 'Campeonato' }
  }
}

export default async function ChampionshipDetailLayout({ children, params }: Props) {
  const { tenant, id } = await params

  let championship: Championship | null = null
  try {
    championship = await publicFetch<Championship>(tenant, `championships/${id}`)
  } catch {
    notFound()
  }

  if (!championship) notFound()

  const st = STATUS_MAP[championship.status] ?? { label: championship.status, variant: 'outline' as const }
  const base = `/${tenant}/championships/${id}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Championship header */}
      <div className="flex items-start gap-4">
        <div className="relative flex size-14 items-center justify-center rounded-xl border border-border bg-primary/10 overflow-hidden shrink-0">
          {championship.logo_url
            ? <Image src={championship.logo_url} alt={championship.name} fill className="object-cover" sizes="56px" />
            : <Trophy className="size-7 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{championship.name}</h1>
            <Badge variant={st.variant} className="shrink-0">{st.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Temporada {championship.season} · {FORMAT_LABEL[championship.format] ?? championship.format}
            {championship.legs > 1 && ` · ${championship.legs} turnos`}
          </p>
        </div>
      </div>

      <ChampionshipNav base={base} />

      <div>{children}</div>
    </div>
  )
}
