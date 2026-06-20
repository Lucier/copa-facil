import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Calendar, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

interface Props {
  params: Promise<{ tenant: string; slug: string }>
}

const ARTICLES_DATA: Record<string, {
  slug: string; title: string; excerpt: string; category: string
  publishedAt: string; author: string
  content: string
}> = {
  'rapidos-fc-vence-semifinais': {
    slug: 'rapidos-fc-vence-semifinais',
    title: 'Rápidos FC domina e vence por 3×1 para avançar às semifinais',
    excerpt: 'Com um hat-trick de Carlos Mendes, o Rápidos FC encerrou o duelo ainda no primeiro tempo.',
    category: 'Resultado',
    publishedAt: '2026-06-08',
    author: 'Redação Copa Fácil',
    content: `O Rápidos FC confirmou sua superioridade no Regional 2024 ao superar o Unidos SC por 3 a 1, neste domingo, no Estádio Municipal. Com um hat-trick do artilheiro Carlos Mendes, a equipe garantiu vaga nas semifinais com duas rodadas de antecedência.

**Primeiro tempo dominante**

A partida começou movimentada, com o Rápidos FC impondo seu ritmo desde os primeiros minutos. Aos 12 minutos, após falta dentro da área, Carlos Mendes converteu o pênalti com frieza para abrir o placar.

O segundo gol veio aos 28 minutos, em uma jogada de alto nível técnico: Rafael Lima recebeu pela direita, tabelou com Pedro Santos e cruzou na medida para Mendes completar de cabeça.

O Unidos SC descontou aos 44 minutos, em um raro momento de perigo para o goleiro Lucas Pereira: Rafael Costa aproveitou falha na marcação e finalizou cruzado para marcar.

**Carlos Mendes completa hat-trick**

No segundo tempo, o Rápidos FC manteve o controle. Aos 78 minutos, Carlos Mendes selou o hat-trick com uma cabeçada no canto direito após cruzamento preciso de Thiago Souza. O gol foi celebrado com intensidade pela torcida presente nas arquibancadas.

Com a vitória, o Rápidos FC soma 22 pontos e já está matematicamente classificado para as semifinais do Regional 2024, que acontecem no próximo mês.`,
  },
  'tabela-copa-cidade-atualizada': {
    slug: 'tabela-copa-cidade-atualizada',
    title: 'Tabela da Copa Cidade atualizada após rodada dupla',
    excerpt: 'Após quatro partidas, a classificação tem novos líderes em ambos os grupos.',
    category: 'Classificação',
    publishedAt: '2026-06-07',
    author: 'Redação Copa Fácil',
    content: `A terceira rodada da fase de grupos da Copa Cidade foi disputada no final de semana com quatro partidas. O resultado foi uma reviravolta na tabela, com novos líderes em ambos os grupos.

**Grupo A**

Os Falcões EC consolidaram a liderança do Grupo A ao vencer o Santos Atlético por 2 a 0. Com 7 pontos em 3 jogos, a equipe tem uma vitória de vantagem sobre Sport Clube e Guerreiros, que estão empatados em 4 pontos.

**Grupo B**

A Estrela Azul assumiu a ponta do Grupo B com uma vitória convincente sobre o Tornado FC. Rafael Costa, do Unidos SC, marcou dois gols, mas sua equipe terminou empatada.

A próxima rodada acontece no próximo final de semana, com jogos decisivos que definirão os classificados para as quartas de final.`,
  },
  'artilheiro-carlos-mendes': {
    slug: 'artilheiro-carlos-mendes',
    title: 'Carlos Mendes é artilheiro isolado do Regional 2024 com 12 gols',
    excerpt: 'O atacante do Rápidos FC supera Fernando Alves na artilharia.',
    category: 'Estatísticas',
    publishedAt: '2026-06-06',
    author: 'Redação Copa Fácil',
    content: `Carlos Mendes, atacante do Rápidos FC, alcançou a marca de 12 gols no Regional 2024 após a rodada deste domingo, tornando-se o artilheiro isolado da competição.

O jogador ultrapassou Fernando Alves (Leões do Norte), que está na segunda posição com 9 gols. A vantagem de três gols coloca Mendes em posição confortável para ser coroado artilheiro da competição.

Além dos gols, Mendes contribuiu com 5 assistências, tornando-se também um dos jogadores mais decisivos da competição. Sua média de 1,5 gol por jogo é a melhor entre todos os atacantes da liga.

O jogador revelou em entrevista que está focado em ajudar o time a conquistar o título, não apenas nos números individuais: "O que importa é o campeonato. Os gols são consequência do trabalho coletivo."`,
  },
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES_DATA).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES_DATA[slug]
  if (!article) return { title: 'Artigo não encontrado' }
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  }
}

function renderContent(content: string) {
  return content.split('\n\n').map((block, i) => {
    if (block.startsWith('**') && block.endsWith('**')) {
      return <h3 key={i} className="font-display text-lg font-bold mt-6 mb-2">{block.slice(2, -2)}</h3>
    }
    return <p key={i} className="text-base leading-relaxed text-foreground/90">{block}</p>
  })
}

export default async function ArticlePage({ params }: Props) {
  const { tenant, slug } = await params
  const article = ARTICLES_DATA[slug]
  if (!article) notFound()

  // JSON-LD for article SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: article.author },
  }

  const RELATED = Object.values(ARTICLES_DATA)
    .filter((a) => a.slug !== slug)
    .slice(0, 3)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href={`/${tenant}/news`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ChevronLeft className="size-4" /> Todas as notícias
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          {/* Article */}
          <article className="space-y-6">
            <header className="space-y-4">
              <Badge variant="default">{article.category}</Badge>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">{article.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{formatDate(article.publishedAt)}</span>
                <span className="flex items-center gap-1.5"><Tag className="size-3.5" />{article.author}</span>
              </div>
            </header>

            <Separator />

            <div className="prose-spacing space-y-4">
              {renderContent(article.content)}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mais Notícias</p>
              <div className="space-y-3">
                {RELATED.map((a) => (
                  <Link key={a.slug} href={`/${tenant}/news/${a.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:border-primary/30">
                      <CardContent className="p-3 space-y-1.5">
                        <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                        <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</p>
                        <time className="text-[11px] text-muted-foreground">{formatDate(a.publishedAt)}</time>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
