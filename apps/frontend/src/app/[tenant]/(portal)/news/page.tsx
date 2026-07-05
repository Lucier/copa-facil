import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const revalidate = 60

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Notícias',
    description: 'Últimas notícias, resultados e cobertura dos campeonatos.',
    openGraph: { title: 'Notícias — Portal de Campeonatos' },
  }
}

interface Article {
  id: string
  title: string
  slug: string
  content: string
  category: string | null
  published_at: string | null
}

function excerpt(content: string) {
  const block = content.split('\n\n').find((b) => !b.startsWith('**')) ?? content
  return block.length > 180 ? `${block.slice(0, 180)}…` : block
}

export default async function NewsPage({ params }: Props) {
  const { tenant } = await params

  let articles: Article[] = []
  try {
    const res = await publicFetch<Paginated<Article>>(tenant, 'articles', { limit: '20' })
    articles = res.data
  } catch {
    // silently show empty state
  }

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <Newspaper className="size-7 text-primary" />
            Notícias
          </h1>
          <p className="mt-2 text-muted-foreground">Cobertura completa dos campeonatos, resultados e bastidores.</p>
        </div>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Newspaper className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma notícia publicada ainda.</p>
        </div>
      </div>
    )
  }

  const [featured, ...rest] = articles

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
              {featured.category && <Badge variant="default">{featured.category}</Badge>}
              <h2 className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors sm:text-3xl">
                {featured.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{excerpt(featured.content)}</p>
              <div className="flex items-center gap-3 pt-1">
                {featured.published_at && (
                  <time className="text-xs text-muted-foreground">{formatDate(featured.published_at)}</time>
                )}
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
                {article.category && <Badge variant="outline" className="w-fit text-[10px]">{article.category}</Badge>}
                <h3 className="flex-1 font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt(article.content)}</p>
                {article.published_at && (
                  <time className="text-[11px] text-muted-foreground">{formatDate(article.published_at)}</time>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
