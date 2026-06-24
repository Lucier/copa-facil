'use client'
import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trophy, Calendar, Users, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { NewChampionshipDialog } from '@/components/admin/NewChampionshipDialog'
import { GenerateFixturesDialog } from '@/components/admin/GenerateFixturesDialog'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Championship {
  id: string
  name: string
  season: string
  format: string
  legs: number
  status: 'active' | 'finished' | 'draft'
  createdAt: string
  updatedAt: string
}

interface Team {
  id: string
  name: string
  acronym: string | null
  city: string | null
  primaryColor: string | null
}

const FORMAT_LABELS: Record<string, string> = {
  pontos_corridos: 'Pontos Corridos',
  mata_mata: 'Mata-Mata',
  grupos_mata_mata: 'Grupos + Mata-Mata',
}

const STATUS_VARIANTS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativo', variant: 'success' },
  finished: { label: 'Encerrado', variant: 'default' },
  draft: { label: 'Rascunho', variant: 'outline' },
}

async function fetchChampionships(): Promise<Championship[]> {
  const { data } = await api.get<Championship[]>(API.championships.base)
  return data
}

async function fetchTeams(): Promise<Team[]> {
  const { data } = await api.get<Team[]>(API.teams.base)
  return data
}

export default function ChampionshipsPage() {
  const queryClient = useQueryClient()

  const { data: championships = [], isLoading, isError } = useQuery({
    queryKey: ['championships'],
    queryFn: fetchChampionships,
  })

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: ['championships'] })
  }

  const activeCount = championships.filter((c) => c.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Campeonatos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie todos os campeonatos da organização.</p>
        </div>
        <NewChampionshipDialog onCreated={handleCreated}>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Novo Campeonato
          </Button>
        </NewChampionshipDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Campeonatos Ativos', value: activeCount, icon: Trophy, color: 'text-primary' },
          { label: 'Times Participantes', value: 0, icon: Users, color: 'text-blue-400' },
          { label: 'Próximas Partidas', value: 0, icon: Calendar, color: 'text-amber-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`size-8 ${s.color}`} />
              <div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Todos os Campeonatos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Erro ao carregar campeonatos.
            </p>
          ) : championships.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum campeonato cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {championships.map((c) => {
                  const st = STATUS_VARIANTS[c.status] ?? STATUS_VARIANTS.draft
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.season}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {FORMAT_LABELS[c.format] ?? c.format}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.legs === 1 ? 'Jogo único' : 'Ida e volta'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === 'draft' && (
                          <GenerateFixturesDialog
                            championship={c}
                            teams={teams}
                            onSuccess={handleCreated}
                          >
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <Zap className="size-3.5" />
                              Gerar Partidas
                            </Button>
                          </GenerateFixturesDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
