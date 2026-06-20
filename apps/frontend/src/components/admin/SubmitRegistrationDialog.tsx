'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { submitRegistrationSchema, type SubmitRegistrationInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface Championship { id: string; name: string; season: string }
interface Team { id: string; name: string; acronym: string | null }

interface SubmitRegistrationDialogProps {
  children: React.ReactNode
  defaultChampionshipId?: string
  onSuccess?: () => void
}

export function SubmitRegistrationDialog({
  children,
  defaultChampionshipId,
  onSuccess,
}: SubmitRegistrationDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data } = await api.get(API.championships.base)
      return data as Championship[]
    },
    enabled: open,
  })

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await api.get(API.teams.base)
      return data as Team[]
    },
    enabled: open,
  })

  const form = useForm<SubmitRegistrationInput>({
    resolver: zodResolver(submitRegistrationSchema),
    defaultValues: {
      championshipId: defaultChampionshipId ?? '',
      teamId: '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: SubmitRegistrationInput) {
    setServerError(null)
    try {
      await api.post(API.registrations.base, values)
      onSuccess?.()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao submeter inscrição.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset({ championshipId: defaultChampionshipId ?? '', teamId: '' })
    setServerError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Inscrição</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="championshipId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campeonato *</FormLabel>
                  <FormControl>
                    <select {...field} className={SELECT_CLASS} disabled={Boolean(defaultChampionshipId)}>
                      <option value="">Selecione um campeonato...</option>
                      {championships.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time *</FormLabel>
                  <FormControl>
                    <select {...field} className={SELECT_CLASS}>
                      <option value="">Selecione um time...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.acronym ? ` (${t.acronym})` : ''}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Inscrever Time
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
