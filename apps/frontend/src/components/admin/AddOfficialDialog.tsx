'use client'
import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const OFFICIAL_ROLES = [
  { value: 'arbitro_principal', label: 'Árbitro Principal' },
  { value: 'assistente_1', label: 'Assistente 1' },
  { value: 'assistente_2', label: 'Assistente 2' },
  { value: 'quarto_arbitro', label: 'Quarto Árbitro' },
  { value: 'assessor', label: 'Assessor' },
  { value: 'delegado', label: 'Delegado' },
]

interface RegisteredJudge {
  id: string
  fullName: string
  role: string
  licenseNumber: string | null
}

interface AddOfficialDialogProps {
  open: boolean
  matchId: string
  onSuccess: () => void
  onClose: () => void
}

export function AddOfficialDialog({ open, matchId, onSuccess, onClose }: AddOfficialDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState('arbitro_principal')
  const [licenseNumber, setLicenseNumber] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const { data: registeredJudges = [] } = useQuery<RegisteredJudge[]>({
    queryKey: ['judges'],
    queryFn: async () => {
      const { data } = await api.get(API.judges.base)
      return (data as RegisteredJudge[]).filter((j: RegisteredJudge & { isActive?: boolean }) => j.isActive !== false)
    },
    enabled: open,
  })

  function pickJudge(judgeId: string) {
    const j = registeredJudges.find((r) => r.id === judgeId)
    if (!j) return
    setName(j.fullName)
    // map judge role to official role (assistente → assistente_1 as default)
    const mappedRole = j.role === 'assistente' ? 'assistente_1' : j.role
    if (OFFICIAL_ROLES.some((r) => r.value === mappedRole)) {
      setRole(mappedRole)
    }
    setLicenseNumber(j.licenseNumber ?? '')
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post(API.sumula.officials(matchId), {
        name,
        role,
        licenseNumber: licenseNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sumula', matchId] })
      onSuccess()
      handleClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao adicionar árbitro.'
      setError(Array.isArray(msg) ? msg.join(', ') : (msg as string))
    },
  })

  function handleClose() {
    setName('')
    setRole('arbitro_principal')
    setLicenseNumber('')
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Informe o nome.'); return }
    setError(null)
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Árbitro / Oficial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick-pick from registry */}
          {registeredJudges.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="judgeRegistry">Selecionar do cadastro</Label>
              <select
                id="judgeRegistry"
                defaultValue=""
                onChange={(e) => pickJudge((e.target as HTMLSelectElement).value)}
                className={SELECT_CLASS}
              >
                <option value="">Digitar manualmente...</option>
                {registeredJudges.map((j) => (
                  <option key={j.id} value={j.id}>{j.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {registeredJudges.length > 0 && <Separator />}

          <div className="space-y-1.5">
            <Label htmlFor="officialName">Nome</Label>
            <Input
              id="officialName"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="officialRole">Função</Label>
            <select
              id="officialRole"
              value={role}
              onChange={(e) => setRole((e.target as HTMLSelectElement).value)}
              className={SELECT_CLASS}
            >
              {OFFICIAL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="licenseNumber">Licença (opcional)</Label>
            <Input
              id="licenseNumber"
              placeholder="ex: CBF-2024-001"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber((e.target as HTMLInputElement).value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
