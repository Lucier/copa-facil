'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { reviewRegistrationSchema, type ReviewRegistrationInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface Registration {
  id: string
  teamName: string
  championshipName: string
}

interface ReviewRegistrationDialogProps {
  registration: Registration | null
  mode: 'approve' | 'reject'
  onSuccess: () => void
  onClose: () => void
}

export function ReviewRegistrationDialog({
  registration,
  mode,
  onSuccess,
  onClose,
}: ReviewRegistrationDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<ReviewRegistrationInput>({
    resolver: zodResolver(reviewRegistrationSchema),
    defaultValues: { reviewNote: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ReviewRegistrationInput) {
    if (!registration) return
    setServerError(null)
    try {
      const endpoint = mode === 'approve'
        ? API.registrations.approve(registration.id)
        : API.registrations.reject(registration.id)
      await api.patch(endpoint, values)
      onSuccess()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Erro ao ${mode === 'approve' ? 'aprovar' : 'rejeitar'} inscrição.`
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset({ reviewNote: '' })
    setServerError(null)
    onClose()
  }

  const isApprove = mode === 'approve'

  return (
    <Dialog open={Boolean(registration)} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove
              ? <><CheckCircle2 className="size-4 text-emerald-400" /> Aprovar Inscrição</>
              : <><XCircle className="size-4 text-destructive" /> Rejeitar Inscrição</>
            }
          </DialogTitle>
        </DialogHeader>

        {registration && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{registration.teamName}</strong>
            {' '}em{' '}
            <strong className="text-foreground">{registration.championshipName}</strong>
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reviewNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação <span className="text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isApprove ? 'Aprovado sem pendências.' : 'Motivo da rejeição...'}
                      {...field}
                      value={field.value ?? ''}
                    />
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
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={isApprove ? 'default' : 'destructive'}
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isApprove ? 'Aprovar' : 'Rejeitar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
