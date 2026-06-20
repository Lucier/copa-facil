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
import { createChampionshipSchema, type CreateChampionshipInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const FORMAT_OPTIONS = [
  { value: 'pontos_corridos', label: 'Pontos Corridos' },
  { value: 'mata_mata', label: 'Mata-Mata' },
  { value: 'grupos_mata_mata', label: 'Grupos + Mata-Mata' },
] as const

const LEGS_OPTIONS = [
  { value: 1, label: 'Jogo único' },
  { value: 2, label: 'Ida e volta' },
] as const

interface NewChampionshipDialogProps {
  children: React.ReactNode
  onCreated?: () => void
}

export function NewChampionshipDialog({ children, onCreated }: NewChampionshipDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<CreateChampionshipInput>({
    resolver: zodResolver(createChampionshipSchema),
    defaultValues: {
      name: '',
      season: String(new Date().getFullYear()),
      format: 'pontos_corridos',
      legs: 1,
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateChampionshipInput) {
    setServerError(null)
    try {
      await api.post(API.championships.base, values)
      onCreated?.()
      setOpen(false)
      form.reset()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao criar campeonato. Verifique se você está autenticado.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset()
      setServerError(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Campeonato</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Copa Municipal 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporada</FormLabel>
                  <FormControl>
                    <Input placeholder="2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {FORMAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {LEGS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Criar Campeonato
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
