'use client'
import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SubmitRegistrationDialog } from '@/components/admin/SubmitRegistrationDialog'
import { ReviewRegistrationDialog } from '@/components/admin/ReviewRegistrationDialog'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' | 'outline' }> = {
  pendente:   { label: 'Pendente',    variant: 'outline' },
  em_analise: { label: 'Em Análise',  variant: 'warning' },
  aprovado:   { label: 'Aprovado',    variant: 'success' },
  rejeitado:  { label: 'Rejeitado',   variant: 'destructive' },
}

interface Championship { id: string; name: string; season: string }
interface Team { id: string; name: string; acronym: string | null }

interface Registration {
  id: string
  championshipId: string
  teamId: string
  status: string
  submittedBy: string
  reviewedBy: string | null
  reviewNote: string | null
  submittedAt: string
  reviewedAt: string | null
}

interface ReviewTarget {
  id: string
  teamName: string
  championshipName: string
}

export default function RegistrationsPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState<string>('')
  const [reviewTarget, setReviewTarget] = React.useState<ReviewTarget | null>(null)
  const [reviewMode, setReviewMode] = React.useState<'approve' | 'reject'>('approve')

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data } = await api.get(API.championships.base)
      return data as Championship[]
    },
  })

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
  })

  React.useEffect(() => {
    if (championships.length > 0 && !selectedChampId) {
      setSelectedChampId(championships[0].id)
    }
  }, [championships, selectedChampId])

  const { data: registrations = [], isLoading, isError } = useQuery<Registration[]>({
    queryKey: ['registrations', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(`${API.registrations.base}?championshipId=${selectedChampId}`)
      return data as Registration[]
    },
    enabled: Boolean(selectedChampId),
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['registrations', selectedChampId] })
  }

  const teamMap = React.useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams],
  )
  const champMap = React.useMemo(
    () => new Map(championships.map((c) => [c.id, c])),
    [championships],
  )

  const selectedChamp = champMap.get(selectedChampId)

  function openReview(reg: Registration, mode: 'approve' | 'reject') {
    const team = teamMap.get(reg.teamId)
    const champ = champMap.get(reg.championshipId)
    setReviewTarget({
      id: reg.id,
      teamName: team?.name ?? reg.teamId,
      championshipName: champ ? `${champ.name} (${champ.season})` : reg.championshipId,
    })
    setReviewMode(mode)
  }

  const pendingCount = registrations.filter((r) => r.status === 'pendente' || r.status === 'em_analise').length
  const approvedCount = registrations.filter((r) => r.status === 'aprovado').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Inscrições</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie as inscrições de times nos campeonatos.</p>
        </div>
        <SubmitRegistrationDialog
          defaultChampionshipId={selectedChampId || undefined}
          onSuccess={handleSuccess}
        >
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Nova Inscrição
          </Button>
        </SubmitRegistrationDialog>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Campeonato:</label>
        <select
          value={selectedChampId}
          onChange={(e) => setSelectedChampId((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          {championships.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total de Inscrições', value: registrations.length, icon: ClipboardList, color: 'text-primary' },
          { label: 'Aguardando Análise', value: pendingCount, icon: Clock, color: 'text-amber-400' },
          { label: 'Aprovadas', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-400' },
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
            {selectedChamp ? `Inscrições — ${selectedChamp.name} (${selectedChamp.season})` : 'Inscrições'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedChampId && (
            <p className="p-6 text-center text-sm text-muted-foreground">Selecione um campeonato acima.</p>
          )}
          {selectedChampId && isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {selectedChampId && isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar inscrições.</p>
          )}
          {selectedChampId && !isLoading && !isError && registrations.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma inscrição neste campeonato ainda.</p>
          )}
          {!isLoading && registrations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Revisado em</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => {
                  const team = teamMap.get(reg.teamId)
                  const st = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.pendente
                  const isPending = reg.status === 'pendente' || reg.status === 'em_analise'
                  return (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        {team ? (
                          <div>
                            <p>{team.name}</p>
                            {team.acronym && (
                              <p className="text-xs text-muted-foreground">{team.acronym}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{reg.teamId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(reg.submittedAt)}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                        {reg.reviewNote ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {reg.reviewedAt ? formatDate(reg.reviewedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                              onClick={() => openReview(reg, 'approve')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/30 text-destructive hover:text-destructive"
                              onClick={() => openReview(reg, 'reject')}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {reg.status === 'aprovado' ? 'Aprovada' : 'Rejeitada'}
                          </span>
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

      <ReviewRegistrationDialog
        registration={reviewTarget}
        mode={reviewMode}
        onSuccess={handleSuccess}
        onClose={() => setReviewTarget(null)}
      />
    </div>
  )
}
