import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { publicFetch, type Paginated } from '@/lib/server-api'

export const revalidate = 60

interface Props {
  params: Promise<{ tenant: string; slug: string }>
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

async function fetchArticle(tenant: string, slug: string): Promise<Article | null> {
  try {
    return await publicFetch<Article>(tenant, `articles/${slug}`)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, slug } = await params
  const article = await fetchArticle(tenant, slug)
  if (!article) return { title: 'Notícia não encontrada' }
  return {
    title: article.title,
    description: excerpt(article.content),
    openGraph: {
      type: 'article',
      title: article.title,
      description: excerpt(article.content),
      publishedTime: article.published_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: excerpt(article.content),
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
  const article = await fetchArticle(tenant, slug)
  if (!article) notFound()

  let related: Article[] = []
  try {
    const res = await publicFetch<Paginated<Article>>(tenant, 'articles', { limit: '4' })
    related = res.data.filter((a) => a.slug !== slug).slice(0, 3)
  } catch {
    // sidebar is optional
  }

  // JSON-LD for article SEO.
  // Replace </script> to prevent tag injection when serialised into an inline script block.
  const jsonLdString = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: excerpt(article.content),
    datePublished: article.published_at,
  }).replace(/<\/script>/gi, '<\\/script>')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href={`/${tenant}/news`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ChevronLeft className="size-4" /> Todas as notícias
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          {/* Article */}
          <article className="space-y-6">
            <header className="space-y-4">
              {article.category && <Badge variant="default">{article.category}</Badge>}
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">{article.title}</h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {article.published_at && (
                  <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{formatDate(article.published_at)}</span>
                )}
              </div>
            </header>

            <Separator />

            <div className="prose-spacing space-y-4">
              {renderContent(article.content)}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {related.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mais Notícias</p>
                <div className="space-y-3">
                  {related.map((a) => (
                    <Link key={a.slug} href={`/${tenant}/news/${a.slug}`}>
                      <Card className="group cursor-pointer transition-all hover:border-primary/30">
                        <CardContent className="p-3 space-y-1.5">
                          {a.category && <Badge variant="outline" className="text-[10px]">{a.category}</Badge>}
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</p>
                          {a.published_at && (
                            <time className="text-[11px] text-muted-foreground">{formatDate(a.published_at)}</time>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
