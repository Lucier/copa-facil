import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Clock, Trophy, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils'

export const revalidate = 60

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params
  const name = tenant.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${name} — Portal Oficial`,
    openGraph: { title: `${name} — Portal Oficial de Campeonatos` },
  }
}

const LIVE_MATCHES = [
  { id: '2', home: 'Estrela Azul', away: 'Leões do Norte', homeScore: 2, awayScore: 1, minute: 67, championship: 'Copa Cidade' },
]

const UPCOMING_MATCHES = [
  { id: '3', home: 'Tornado FC', away: 'Sport Clube', scheduledAt: '2026-06-10T20:00:00Z', championship: 'Regional 2024', round: 'QF - Jogo 2' },
  { id: '5', home: 'Santos Atlético', away: 'Rápidos FC', scheduledAt: '2026-06-11T21:00:00Z', championship: 'Regional 2024', round: 'QF - Jogo 3' },
  { id: '6', home: 'Guerreiros', away: 'Falcões EC', scheduledAt: '2026-06-12T19:30:00Z', championship: 'Copa Cidade', round: 'Fase de Grupos - R4' },
]

const LATEST_NEWS = [
  {
    slug: 'rapidos-fc-vence-semifinais',
    title: 'Rápidos FC domina e vence por 3×1 para avançar às semifinais',
    excerpt: 'Com um hat-trick de Carlos Mendes, o Rápidos FC encerrou o duelo ainda no primeiro tempo e assegurou vaga na próxima fase.',
    publishedAt: '2026-06-08',
    category: 'Resultado',
    featured: true,
  },
  {
    slug: 'tabela-copa-cidade-atualizada',
    title: 'Tabela da Copa Cidade atualizada após rodada dupla',
    excerpt: 'Após quatro partidas disputadas, a classificação da Copa Cidade tem novos líderes de grupo.',
    publishedAt: '2026-06-07',
    category: 'Classificação',
    featured: false,
  },
  {
    slug: 'inscricoes-liga-municipal',
    title: 'Inscrições abertas para a Liga Municipal 2026',
    excerpt: 'As vagas são limitadas e os times interessados devem enviar a documentação completa até 31 de julho.',
    publishedAt: '2026-06-05',
    category: 'Inscrições',
    featured: false,
  },
  {
    slug: 'artilheiro-carlos-mendes',
    title: 'Carlos Mendes é o artilheiro isolado do Regional 2024 com 12 gols',
    excerpt: 'O atacante do Rápidos FC ultrapassa Fernando Alves e lidera a artilharia com três gols de vantagem.',
    publishedAt: '2026-06-04',
    category: 'Estatísticas',
    featured: false,
  },
]

const STANDINGS_PREVIEW = [
  { pos: 1, team: 'Rápidos FC', pts: 22, pj: 8 },
  { pos: 2, team: 'Estrela Azul', pts: 16, pj: 8 },
  { pos: 3, team: 'Tornado FC', pts: 13, pj: 8 },
  { pos: 4, team: 'Unidos SC', pts: 10, pj: 8 },
  { pos: 5, team: 'Leões do Norte', pts: 7, pj: 8 },
]

export default async function PublicHomePage({ params }: Props) {
  const { tenant } = await params

  return (
    <div className="space-y-0">
      {/* Live banner */}
      {LIVE_MATCHES.length > 0 && (
        <div className="border-b border-primary/30 bg-primary/8 py-2">
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4">
            <Badge variant="live" className="shrink-0 gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              AO VIVO
            </Badge>
            {LIVE_MATCHES.map((m) => (
              <Link
                key={m.id}
                href={`/${tenant}/matches/${m.id}`}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <span>{m.home}</span>
                <span className="font-display font-bold text-primary">{m.homeScore} – {m.awayScore}</span>
                <span>{m.away}</span>
                <span className="text-xs text-muted-foreground">{m.minute}'</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            {/* Featured article */}
            <div className="space-y-4">
              <Badge variant="default" className="text-[10px]">{LATEST_NEWS[0].category}</Badge>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
                {LATEST_NEWS[0].title}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                {LATEST_NEWS[0].excerpt}
              </p>
              <Link
                href={`/${tenant}/news/${LATEST_NEWS[0].slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Ler matéria completa <ChevronRight className="size-4" />
              </Link>
            </div>

            {/* Standings preview */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Regional 2024</span>
                </div>
                <Link href={`/${tenant}/standings`} className="text-xs text-primary hover:underline">
                  Ver completa
                </Link>
              </div>
              <div className="space-y-1">
                {STANDINGS_PREVIEW.map((row) => (
                  <div key={row.pos} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors">
                    <span className={`w-5 text-center text-[11px] font-bold ${row.pos <= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {row.pos}
                    </span>
                    <span className="flex-1 font-medium">{row.team}</span>
                    <span className="text-xs text-muted-foreground">{row.pj} jg</span>
                    <span className="w-7 text-right font-display font-bold text-sm">{row.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming matches */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              Próximas Partidas
            </h2>
            <Link href={`/${tenant}/matches`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver agenda <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {UPCOMING_MATCHES.map((m) => (
              <Link key={m.id} href={`/${tenant}/matches/${m.id}`}>
                <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{m.championship}</span>
                      <span className="text-[10px] text-muted-foreground">{m.round}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1 text-sm font-semibold text-right">{m.home}</span>
                      <span className="font-display text-xs font-bold text-muted-foreground px-2">VS</span>
                      <span className="flex-1 text-sm font-semibold">{m.away}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDateTime(m.scheduledAt)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Últimas Notícias</h2>
            <Link href={`/${tenant}/news`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LATEST_NEWS.map((article) => (
              <Link key={article.slug} href={`/${tenant}/news/${article.slug}`}>
                <Card className="group h-full cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <Badge variant="outline" className="w-fit text-[10px]">{article.category}</Badge>
                    <h3 className="flex-1 text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <time className="text-[11px] text-muted-foreground">{formatDate(article.publishedAt)}</time>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
