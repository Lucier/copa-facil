'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { concludeMatchSchema, type ConcludeMatchInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface ConcludeMatchDialogProps {
  matchId: string | null
  homeTeamName: string
  awayTeamName: string
  onSuccess: () => void
  onClose: () => void
}

export function ConcludeMatchDialog({
  matchId,
  homeTeamName,
  awayTeamName,
  onSuccess,
  onClose,
}: ConcludeMatchDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<ConcludeMatchInput>({
    resolver: zodResolver(concludeMatchSchema),
    defaultValues: { homeScore: 0, awayScore: 0 },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ConcludeMatchInput) {
    if (!matchId) return
    setServerError(null)
    try {
      await api.post(API.matches.conclude(matchId), values)
      onSuccess()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao encerrar partida.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset({ homeScore: 0, awayScore: 0 })
    setServerError(null)
    onClose()
  }

  return (
    <Dialog open={Boolean(matchId)} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Encerrar Partida</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {homeTeamName} <span className="text-foreground font-medium">vs.</span> {awayTeamName}
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="homeScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{homeTeamName || 'Casa'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awayScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{awayTeamName || 'Visitante'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))}
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Encerrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
