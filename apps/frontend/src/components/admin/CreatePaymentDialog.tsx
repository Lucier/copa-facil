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
import { createPaymentSchema, type CreatePaymentInput } from '@/lib/zod-schemas'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
}

const CATEGORY_LABELS: Record<string, string> = {
  inscricao: 'Inscrição',
  patrocinio: 'Patrocínio',
  receita_avulsa: 'Receita Avulsa',
}

interface Championship { id: string; name: string; season: string }

interface CreatePaymentDialogProps {
  children: React.ReactNode
  championships: Championship[]
  defaultChampionshipId?: string
  onSuccess?: () => void
}

export function CreatePaymentDialog({
  children,
  championships,
  defaultChampionshipId,
  onSuccess,
}: CreatePaymentDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      championshipId: defaultChampionshipId ?? '',
      referenceId: '',
      referenceType: '',
      amountBrl: 0,
      method: 'pix',
      category: 'inscricao',
      description: '',
      payerEmail: '',
      ttlMinutes: undefined,
      payerName: '',
      payerDocument: '',
      dueDate: '',
      cardToken: '',
      installments: undefined,
    },
  })

  const { isSubmitting } = form.formState
  const method = form.watch('method')

  async function onSubmit(values: CreatePaymentInput) {
    setServerError(null)
    const { amountBrl, ...rest } = values
    const payload = {
      ...rest,
      amount: Math.round(amountBrl * 100),
    }
    try {
      await api.post(API.payments.base, payload)
      onSuccess?.()
      handleClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao criar cobrança.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  function handleClose() {
    form.reset()
    setServerError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campeonato */}
            <FormField
              control={form.control}
              name="championshipId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campeonato</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={SELECT_CLASS}
                      disabled={Boolean(defaultChampionshipId)}
                    >
                      <option value="">Sem vínculo</option>
                      {championships.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Inscrição — Rápidos FC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Valor */}
              <FormField
                control={form.control}
                name="amountBrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="100,00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat((e.target as HTMLInputElement).value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <FormControl>
                      <select {...field} className={SELECT_CLASS}>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Método */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <FormControl>
                    <select {...field} className={SELECT_CLASS}>
                      {Object.entries(METHOD_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail do pagador */}
            <FormField
              control={form.control}
              name="payerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail do Pagador</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="pagador@email.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PIX fields */}
            {method === 'pix' && (
              <FormField
                control={form.control}
                name="ttlMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        placeholder="30"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = (e.target as HTMLInputElement).value
                          field.onChange(v ? parseInt(v, 10) : undefined)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Boleto fields */}
            {method === 'boleto' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Pagador *</FormLabel>
                        <FormControl>
                          <Input placeholder="João da Silva" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payerDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Credit card fields */}
            {method === 'cartao_credito' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cardToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token do Cartão *</FormLabel>
                      <FormControl>
                        <Input placeholder="Token MP" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <FormControl>
                        <select
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(parseInt((e.target as HTMLSelectElement).value, 10))}
                          className={SELECT_CLASS}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                Criar Cobrança
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
