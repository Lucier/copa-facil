'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { createJudgeSchema, type CreateJudgeInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const ROLES = [
  { value: 'arbitro_principal', label: 'Árbitro Principal' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'quarto_arbitro', label: 'Quarto Árbitro' },
  { value: 'assessor', label: 'Assessor' },
  { value: 'delegado', label: 'Delegado' },
] as const

const CATEGORIES = [
  { value: 'federal', label: 'Federal (CBF/FIFA)' },
  { value: 'estadual', label: 'Estadual' },
  { value: 'municipal', label: 'Municipal' },
] as const

interface Judge {
  id: string
  fullName: string
  document: string | null
  licenseNumber: string | null
  licenseCategory: string | null
  role: string
  phone: string | null
  email: string | null
  isActive: boolean
}

interface JudgeDialogProps {
  children: React.ReactNode
  judge?: Judge
  onSuccess?: () => void
}

export function JudgeDialog({ children, judge, onSuccess }: JudgeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const isEditing = Boolean(judge)

  const form = useForm<CreateJudgeInput>({
    resolver: zodResolver(createJudgeSchema),
    defaultValues: {
      fullName: judge?.fullName ?? '',
      document: judge?.document ?? '',
      licenseNumber: judge?.licenseNumber ?? '',
      licenseCategory: (judge?.licenseCategory as CreateJudgeInput['licenseCategory']) ?? undefined,
      role: (judge?.role as CreateJudgeInput['role']) ?? 'arbitro_principal',
      phone: judge?.phone ?? '',
      email: judge?.email ?? '',
      isActive: judge?.isActive ?? true,
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateJudgeInput) {
    setServerError(null)
    try {
      if (isEditing && judge) {
        await api.patch(API.judges.byId(judge.id), values)
      } else {
        await api.post(API.judges.base, values)
      }
      onSuccess?.()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} juiz.`
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset({
      fullName: judge?.fullName ?? '',
      document: judge?.document ?? '',
      licenseNumber: judge?.licenseNumber ?? '',
      licenseCategory: (judge?.licenseCategory as CreateJudgeInput['licenseCategory']) ?? undefined,
      role: (judge?.role as CreateJudgeInput['role']) ?? 'arbitro_principal',
      phone: judge?.phone ?? '',
      email: judge?.email ?? '',
      isActive: judge?.isActive ?? true,
    })
    setServerError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Juiz' : 'Cadastrar Juiz'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <FormControl>
                      <select {...field} className={SELECT_CLASS}>
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange((e.target as HTMLSelectElement).value || undefined)}
                        className={SELECT_CLASS}
                      >
                        <option value="">Selecionar...</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="123.456.789-00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Licença</FormLabel>
                    <FormControl>
                      <Input placeholder="CBF-2024-001" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="joao@arbitragem.com" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.value ?? true}
                        onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                        className="size-4 rounded border-border accent-primary"
                      />
                      <span className="font-medium">Juiz ativo</span>
                    </label>
                  </FormItem>
                )}
              />
            )}

            {serverError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {serverError}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Juiz'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
