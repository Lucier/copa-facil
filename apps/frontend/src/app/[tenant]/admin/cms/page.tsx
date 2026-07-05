'use client'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText, Image, Video, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Article {
  id: string
  title: string
  slug: string
  status: string
  publishedAt: string | null
}

interface Gallery {
  id: string
  title: string
  createdAt: string
}

interface VideoItem {
  id: string
  title: string
  provider: string
  createdAt: string
}

export default function CmsPage() {
  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ['cms-articles'],
    queryFn: async () => (await api.get(API.cms.articles)).data,
  })

  const { data: galleries = [] } = useQuery<Gallery[]>({
    queryKey: ['cms-galleries'],
    queryFn: async () => (await api.get(API.cms.galleries)).data,
  })

  const { data: videos = [] } = useQuery<VideoItem[]>({
    queryKey: ['cms-videos'],
    queryFn: async () => (await api.get(API.cms.videos)).data,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">CMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie artigos, galerias e vídeos do portal.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          Novo Artigo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Artigos Publicados', value: articles.filter((a) => a.status === 'published').length, icon: FileText },
          { label: 'Galerias', value: galleries.length, icon: Image },
          { label: 'Vídeos', value: videos.length, icon: Video },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className="size-8 text-primary" />
              <div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Articles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Artigos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {articles.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum artigo cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Publicado em</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer">
                    <TableCell className="font-medium text-sm">{a.title}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground font-mono">{a.slug}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.publishedAt ? formatDate(a.publishedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === 'published' ? (
                        <Badge variant="success" className="gap-1">
                          <Eye className="size-3" />Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <EyeOff className="size-3" />Rascunho
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Galleries */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Galerias
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
              <Plus className="size-3" />Nova
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {galleries.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma galeria cadastrada.</p>
            ) : (
              galleries.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Image className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Vídeos
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
              <Plus className="size-3" />Novo
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {videos.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhum vídeo cadastrado.</p>
            ) : (
              videos.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Video className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{v.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{v.provider}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
