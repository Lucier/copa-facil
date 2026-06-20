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
import { registerPlayerSchema, type RegisterPlayerInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const POSITIONS = [
  'Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo',
  'Volante', 'Meio-Campo', 'Meia Atacante', 'Atacante',
  'Ponta Direita', 'Ponta Esquerda',
]

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface Player {
  id: string
  teamId: string
  fullName: string
  birthdate: string | null
  document: string | null
  documentType: string
  jerseyNumber: number | null
  preferredFoot: string
  mainPosition: string
  subPositions: string[]
}

interface PlayerDialogProps {
  children: React.ReactNode
  teamId: string
  player?: Player
  onSuccess?: () => void
}

export function PlayerDialog({ children, teamId, player, onSuccess }: PlayerDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const isEditing = Boolean(player)

  const form = useForm<RegisterPlayerInput>({
    resolver: zodResolver(registerPlayerSchema),
    defaultValues: {
      fullName: player?.fullName ?? '',
      birthdate: player?.birthdate ? player.birthdate.split('T')[0] : '',
      document: player?.document ?? '',
      documentType: (player?.documentType as 'cpf' | 'passaporte') ?? 'cpf',
      jerseyNumber: player?.jerseyNumber ?? undefined,
      preferredFoot: (player?.preferredFoot as 'direito' | 'esquerdo' | 'ambidestro') ?? 'direito',
      mainPosition: player?.mainPosition ?? '',
      subPositions: player?.subPositions ?? [],
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: RegisterPlayerInput) {
    setServerError(null)
    try {
      if (isEditing && player) {
        await api.patch(API.teams.playerById(teamId, player.id), values)
      } else {
        await api.post(API.teams.players(teamId), values)
      }
      onSuccess?.()
      setOpen(false)
      form.reset()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} jogador.`
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({
        fullName: player?.fullName ?? '',
        birthdate: player?.birthdate ? player.birthdate.split('T')[0] : '',
        document: player?.document ?? '',
        documentType: (player?.documentType as 'cpf' | 'passaporte') ?? 'cpf',
        jerseyNumber: player?.jerseyNumber ?? undefined,
        preferredFoot: (player?.preferredFoot as 'direito' | 'esquerdo' | 'ambidestro') ?? 'direito',
        mainPosition: player?.mainPosition ?? '',
        subPositions: player?.subPositions ?? [],
      })
      setServerError(null)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Jogador' : 'Cadastrar Jogador'}</DialogTitle>
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
                    <Input placeholder="Carlos Eduardo Mendes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jerseyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Camisa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        placeholder="10"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => { const v = (e.target as HTMLInputElement).value; field.onChange(v === '' ? undefined : Number(v)) }}
                      />
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
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <select {...field} className={SELECT_CLASS}>
                        <option value="cpf">CPF</option>
                        <option value="passaporte">Passaporte</option>
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
                name="mainPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição Principal *</FormLabel>
                    <FormControl>
                      <select {...field} className={SELECT_CLASS}>
                        <option value="">Selecione...</option>
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredFoot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pé Preferido</FormLabel>
                    <FormControl>
                      <select {...field} className={SELECT_CLASS}>
                        <option value="direito">Direito</option>
                        <option value="esquerdo">Esquerdo</option>
                        <option value="ambidestro">Ambidestro</option>
                      </select>
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
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Jogador'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
