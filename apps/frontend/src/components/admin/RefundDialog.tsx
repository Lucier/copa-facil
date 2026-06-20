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
import { refundPaymentSchema, type RefundPaymentInput } from '@/lib/zod-schemas'
import { formatCurrency } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface RefundTarget {
  id: string
  description: string
  amount: number
}

interface RefundDialogProps {
  transaction: RefundTarget | null
  onSuccess: () => void
  onClose: () => void
}

export function RefundDialog({ transaction, onSuccess, onClose }: RefundDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<RefundPaymentInput>({
    resolver: zodResolver(refundPaymentSchema),
    defaultValues: { amountBrl: undefined },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: RefundPaymentInput) {
    if (!transaction) return
    setServerError(null)
    try {
      const payload = values.amountBrl
        ? { amount: Math.round(values.amountBrl * 100) }
        : {}
      await api.post(API.payments.refund(transaction.id), payload)
      onSuccess()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao processar reembolso.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset({ amountBrl: undefined })
    setServerError(null)
    onClose()
  }

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reembolsar Transação</DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">
              Valor total: <span className="text-foreground font-medium">{formatCurrency(transaction.amount)}</span>
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountBrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Valor do reembolso (R$)
                    <span className="ml-1 text-xs text-muted-foreground">— deixe em branco para reembolso total</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={transaction ? String((transaction.amount / 100).toFixed(2)) : '0,00'}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value
                        field.onChange(v ? parseFloat(v) : undefined)
                      }}
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
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirmar Reembolso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
