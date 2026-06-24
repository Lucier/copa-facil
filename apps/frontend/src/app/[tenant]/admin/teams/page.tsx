'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Shield, Users, Trash2, Link2, Check } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { TeamDialog } from '@/components/admin/TeamDialog'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Team {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  inviteToken: string
  createdAt: string
  updatedAt: string
}

function CopyInviteLinkButton({ token, tenant }: { token: string; tenant: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/${tenant}/join/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="size-3.5 text-green-500" /> : <Link2 className="size-3.5" />}
      {copied ? 'Copiado!' : 'Link de Convite'}
    </Button>
  )
}

function ColorSwatch({ color }: { color: string | null }) {
  if (!color) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2">
      <div className="size-4 rounded-sm border border-border" style={{ backgroundColor: color }} />
      <span className="font-mono text-xs text-muted-foreground">{color}</span>
    </div>
  )
}

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const params = useParams()
  const tenant = params.tenant as string
  const [teamToDelete, setTeamToDelete] = React.useState<Team | null>(null)

  const { data: teams = [], isLoading, isError } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API.teams.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setTeamToDelete(null)
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['teams'] })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Times</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os times inscritos nos campeonatos.</p>
        </div>
        <TeamDialog onSuccess={handleSuccess}>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Cadastrar Time
          </Button>
        </TeamDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Times Cadastrados', value: teams.length, icon: Shield, color: 'text-primary' },
          { label: 'Com Cores Definidas', value: teams.filter((t) => t.primaryColor).length, icon: Users, color: 'text-blue-400' },
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
            Todos os Times
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar times.</p>
          )}
          {!isLoading && !isError && teams.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum time cadastrado ainda.</p>
          )}
          {!isLoading && teams.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Cor Principal</TableHead>
                  <TableHead>Cor Secundária</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {team.primaryColor && (
                            <div
                              className="flex size-full items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              {getInitials(team.name)}
                            </div>
                          )}
                          <AvatarFallback className="text-[10px]">{getInitials(team.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {team.nickname && <p className="text-xs text-muted-foreground">{team.nickname}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {team.acronym
                        ? <Badge variant="outline">{team.acronym}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{team.city ?? '—'}</TableCell>
                    <TableCell><ColorSwatch color={team.primaryColor} /></TableCell>
                    <TableCell><ColorSwatch color={team.secondaryColor} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CopyInviteLinkButton token={team.inviteToken} tenant={tenant} />
                        <TeamDialog team={team} onSuccess={handleSuccess}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </TeamDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setTeamToDelete(team)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(teamToDelete)} onOpenChange={(open) => { if (!open) setTeamToDelete(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir time?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O time <strong className="text-foreground">{teamToDelete?.name}</strong> será removido permanentemente.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setTeamToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => teamToDelete && deleteMutation.mutate(teamToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
