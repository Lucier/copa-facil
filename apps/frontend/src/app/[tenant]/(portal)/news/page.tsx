import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Notícias',
    description: 'Últimas notícias, resultados e cobertura dos campeonatos.',
    openGraph: { title: 'Notícias — Portal de Campeonatos' },
  }
}

const ARTICLES = [
  {
    slug: 'rapidos-fc-vence-semifinais',
    title: 'Rápidos FC domina e vence por 3×1 para avançar às semifinais',
    excerpt: 'Com um hat-trick de Carlos Mendes, o Rápidos FC encerrou o duelo ainda no primeiro tempo e assegurou vaga na próxima fase do Regional 2024.',
    publishedAt: '2026-06-08',
    category: 'Resultado',
    featured: true,
  },
  {
    slug: 'tabela-copa-cidade-atualizada',
    title: 'Tabela da Copa Cidade atualizada após rodada dupla',
    excerpt: 'Após quatro partidas disputadas no final de semana, a classificação da Copa Cidade tem novos líderes em ambos os grupos.',
    publishedAt: '2026-06-07',
    category: 'Classificação',
    featured: false,
  },
  {
    slug: 'artilheiro-carlos-mendes',
    title: 'Carlos Mendes é artilheiro isolado do Regional 2024 com 12 gols',
    excerpt: 'O atacante do Rápidos FC ultrapassa Fernando Alves e lidera a artilharia com três gols de vantagem a três rodadas do fim.',
    publishedAt: '2026-06-06',
    category: 'Estatísticas',
    featured: false,
  },
  {
    slug: 'inscricoes-liga-municipal',
    title: 'Inscrições abertas para a Liga Municipal 2026',
    excerpt: 'As vagas são limitadas para o novo campeonato municipal. Times interessados devem enviar documentação até 31 de julho.',
    publishedAt: '2026-06-05',
    category: 'Inscrições',
    featured: false,
  },
  {
    slug: 'semifinal-definida',
    title: 'Semifinal do Regional 2024 já tem dois classificados confirmados',
    excerpt: 'Rápidos FC e Estrela Azul estão confirmados nas semifinais. Os outros dois slots serão disputados na rodada desta semana.',
    publishedAt: '2026-06-04',
    category: 'Regional 2024',
    featured: false,
  },
  {
    slug: 'fair-play-reconhecido',
    title: 'Rápidos FC recebe prêmio de melhor índice de fair play',
    excerpt: 'Com apenas 6 cartões amarelos e nenhum vermelho em toda a fase de grupos, o time é reconhecido pela fairness dentro de campo.',
    publishedAt: '2026-06-03',
    category: 'Fair Play',
    featured: false,
  },
]

export default async function NewsPage({ params }: Props) {
  const { tenant } = await params
  const [featured, ...rest] = ARTICLES

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <Newspaper className="size-7 text-primary" />
          Notícias
        </h1>
        <p className="mt-2 text-muted-foreground">Cobertura completa dos campeonatos, resultados e bastidores.</p>
      </div>

      {/* Featured */}
      <Link href={`/${tenant}/news/${featured.slug}`}>
        <Card className="group cursor-pointer overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-3">
              <Badge variant="default">{featured.category}</Badge>
              <h2 className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors sm:text-3xl">
                {featured.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{featured.excerpt}</p>
              <div className="flex items-center gap-3 pt-1">
                <time className="text-xs text-muted-foreground">{formatDate(featured.publishedAt)}</time>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Ler mais <ChevronRight className="size-4" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((article) => (
          <Link key={article.slug} href={`/${tenant}/news/${article.slug}`}>
            <Card className="group h-full cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <Badge variant="outline" className="w-fit text-[10px]">{article.category}</Badge>
                <h3 className="flex-1 font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.excerpt}</p>
                <time className="text-[11px] text-muted-foreground">{formatDate(article.publishedAt)}</time>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
