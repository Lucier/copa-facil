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
import { createTeamSchema, type CreateTeamInput } from '@/lib/zod-schemas'
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
}

interface TeamDialogProps {
  children: React.ReactNode
  team?: Team
  onSuccess?: () => void
}

function ColorInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-7 shrink-0 rounded border border-input"
        style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(value) ? value : 'transparent' }}
      />
      <Input
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        maxLength={7}
      />
    </div>
  )
}

export function TeamDialog({ children, team, onSuccess }: TeamDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const isEditing = Boolean(team)

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: team?.name ?? '',
      acronym: team?.acronym ?? '',
      city: team?.city ?? '',
      nickname: team?.nickname ?? '',
      primaryColor: team?.primaryColor ?? '',
      secondaryColor: team?.secondaryColor ?? '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateTeamInput) {
    setServerError(null)
    try {
      if (isEditing && team) {
        await api.patch(API.teams.byId(team.id), values)
      } else {
        await api.post(API.teams.base, values)
      }
      onSuccess?.()
      setOpen(false)
      form.reset()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} time.`
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({
        name: team?.name ?? '',
        acronym: team?.acronym ?? '',
        city: team?.city ?? '',
        nickname: team?.nickname ?? '',
        primaryColor: team?.primaryColor ?? '',
        secondaryColor: team?.secondaryColor ?? '',
      })
      setServerError(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Time' : 'Cadastrar Time'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rápidos FC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="acronym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sigla</FormLabel>
                    <FormControl>
                      <Input placeholder="RFC" maxLength={4} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido</FormLabel>
                  <FormControl>
                    <Input placeholder="Os Velozes" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Principal</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="#FF0000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Secundária</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="#FFFFFF"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Time'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
