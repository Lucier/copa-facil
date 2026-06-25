'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserCheck, UserX, Search, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { JudgeDialog } from '@/components/admin/JudgeDialog'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const ROLE_LABELS: Record<string, string> = {
  arbitro_principal: 'Árbitro Principal',
  assistente: 'Assistente',
  quarto_arbitro: 'Quarto Árbitro',
  assessor: 'Assessor',
  delegado: 'Delegado',
}

const CATEGORY_LABELS: Record<string, string> = {
  federal: 'Federal',
  estadual: 'Estadual',
  municipal: 'Municipal',
}

const ROLE_VARIANTS: Record<string, 'default' | 'outline' | 'success' | 'warning'> = {
  arbitro_principal: 'default',
  assistente: 'outline',
  quarto_arbitro: 'outline',
  assessor: 'warning',
  delegado: 'warning',
}

interface Judge {
  id: string
  fullName: string
  document: string | null
  licenseNumber: string | null
  licenseCategory: string | null
  role: string
  phone: string | null
  email: string | null
  photoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function JudgesPage() {
  const queryClient = useQueryClient()
  const [judgeToDelete, setJudgeToDelete] = React.useState<Judge | null>(null)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('')

  const { data: judges = [], isLoading, isError } = useQuery<Judge[]>({
    queryKey: ['judges'],
    queryFn: async () => {
      const { data } = await api.get(API.judges.base)
      return data as Judge[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API.judges.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judges'] })
      setJudgeToDelete(null)
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['judges'] })
  }

  const filtered = React.useMemo(() => {
    return judges.filter((j) => {
      const matchSearch =
        !search ||
        j.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (j.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (j.licenseNumber ?? '').toLowerCase().includes(search.toLowerCase())
      const matchRole = !roleFilter || j.role === roleFilter
      return matchSearch && matchRole
    })
  }, [judges, search, roleFilter])

  const activeCount = judges.filter((j) => j.isActive).length
  const arbitroCount = judges.filter((j) => j.role === 'arbitro_principal').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Juízes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o quadro de árbitros e oficiais da organização.
          </p>
        </div>
        <JudgeDialog onSuccess={handleSuccess}>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Cadastrar Juiz
          </Button>
        </JudgeDialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Gavel className="size-8 text-primary" />
            <div>
              <p className="font-display text-2xl font-bold">{judges.length}</p>
              <p className="text-xs text-muted-foreground">Total Cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserCheck className="size-8 text-emerald-400" />
            <div>
              <p className="font-display text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <UserX className="size-8 text-muted-foreground" />
            <div>
              <p className="font-display text-2xl font-bold">{arbitroCount}</p>
              <p className="text-xs text-muted-foreground">Árbitros Principais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou licença..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            className="pl-8"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          <option value="">Todas as funções</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'juiz encontrado' : 'juízes encontrados'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar juízes.</p>
          )}
          {!isLoading && !isError && judges.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum juiz cadastrado. Clique em "Cadastrar Juiz" para começar.
            </p>
          )}
          {!isLoading && judges.length > 0 && filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum juiz encontrado com os filtros selecionados.
            </p>
          )}
          {!isLoading && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((judge) => (
                  <TableRow key={judge.id} className={!judge.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <Avatar className="size-9">
                        {judge.photoUrl && (
                          <AvatarImage src={judge.photoUrl} alt={judge.fullName} className="object-cover" />
                        )}
                        <AvatarFallback className="text-[11px]">{getInitials(judge.fullName)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{judge.fullName}</p>
                        {judge.document && (
                          <p className="text-xs text-muted-foreground">{judge.document}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[judge.role] ?? 'outline'}>
                        {ROLE_LABELS[judge.role] ?? judge.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {judge.licenseCategory ? CATEGORY_LABELS[judge.licenseCategory] ?? judge.licenseCategory : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {judge.licenseNumber ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {judge.phone && <p>{judge.phone}</p>}
                        {judge.email && <p>{judge.email}</p>}
                        {!judge.phone && !judge.email && '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={judge.isActive ? 'success' : 'outline'}>
                        {judge.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <JudgeDialog judge={judge} onSuccess={handleSuccess}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </JudgeDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setJudgeToDelete(judge)}
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

      {/* Delete confirm */}
      <Dialog open={Boolean(judgeToDelete)} onOpenChange={(open) => { if (!open) setJudgeToDelete(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir juiz?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O juiz{' '}
            <strong className="text-foreground">{judgeToDelete?.fullName}</strong> será removido permanentemente.
          </p>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setJudgeToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => judgeToDelete && deleteMutation.mutate(judgeToDelete.id)}
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
