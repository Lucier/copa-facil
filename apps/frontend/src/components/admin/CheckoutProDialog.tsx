'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Copy, ExternalLink, Loader2, ShoppingCart } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const CATEGORY_LABELS: Record<string, string> = {
  inscricao: 'Inscrição',
  patrocinio: 'Patrocínio',
  receita_avulsa: 'Receita Avulsa',
}

const schema = z.object({
  description: z.string().min(3, 'Descrição obrigatória'),
  amountBrl: z.number({ invalid_type_error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  category: z.enum(['inscricao', 'patrocinio', 'receita_avulsa']),
  championshipId: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  payerEmail: z.string().email('E-mail inválido').optional().or(z.literal('')).transform((v) => v || undefined),
  payerLastName: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  maxInstallments: z.number().int().min(1).max(12).optional(),
})

type FormValues = z.infer<typeof schema>

interface Championship { id: string; name: string; season: string }

interface CheckoutProDialogProps {
  children: React.ReactNode
  championships: Championship[]
  defaultChampionshipId?: string
  onSuccess?: () => void
}

export function CheckoutProDialog({
  children,
  championships,
  defaultChampionshipId,
  onSuccess,
}: CheckoutProDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [initPoint, setInitPoint] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amountBrl: 0,
      category: 'inscricao',
      championshipId: defaultChampionshipId ?? '',
      payerEmail: '',
      payerLastName: '',
      maxInstallments: undefined,
    },
  })

  const { isSubmitting } = form.formState

  function openDialog() {
    form.reset({
      description: '',
      amountBrl: 0,
      category: 'inscricao',
      championshipId: defaultChampionshipId ?? '',
      payerEmail: '',
      payerLastName: '',
      maxInstallments: undefined,
    })
    setServerError(null)
    setInitPoint(null)
    setCopied(false)
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setInitPoint(null)
    setServerError(null)
    setCopied(false)
    form.reset()
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const tenant = window.location.pathname.split('/')[1]
    const origin = window.location.origin
    const backBase = `${origin}/${tenant}/pagamento`

    const payload = {
      items: [{
        id: `item-${Date.now()}`,
        title: values.description,
        quantity: 1,
        unitPrice: Math.round(values.amountBrl * 100),
      }],
      backUrls: {
        success: `${backBase}?status=aprovado`,
        failure: `${backBase}?status=recusado`,
        pending: `${backBase}?status=pendente`,
      },
      category: values.category,
      championshipId: values.championshipId,
      payerEmail: values.payerEmail,
      payerLastName: values.payerLastName,
      maxInstallments: values.maxInstallments,
      statementDescriptor: 'CERRADOS ESP',
      binaryMode: false,
    }

    try {
      const { data: tx } = await api.post(API.payments.checkoutPro, payload)
      const point = (tx.gatewayPayload as Record<string, string>)?.initPoint
      if (point) {
        setInitPoint(point)
        onSuccess?.()
        window.open(point, '_blank', 'noopener,noreferrer')
      } else {
        handleClose()
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao criar preferência de pagamento.'
      setServerError(Array.isArray(message) ? message.join(', ') : message)
    }
  }

  async function copyLink() {
    if (!initPoint) return
    await navigator.clipboard.writeText(initPoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); else openDialog() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initPoint ? 'Link de Pagamento Gerado' : 'Checkout Pro — Mercado Pago'}</DialogTitle>
        </DialogHeader>

        {initPoint ? (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Compartilhe o link abaixo com o pagador. Ele será direcionado para o checkout seguro do Mercado Pago, onde poderá escolher a forma de pagamento.
            </p>

            <div className="rounded-md border bg-muted p-3">
              <p className="break-all text-xs font-mono leading-relaxed">{initPoint}</p>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" variant="outline" onClick={copyLink}>
                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
              <Button className="flex-1 gap-2" asChild>
                <a href={initPoint} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Abrir checkout
                </a>
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="championshipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campeonato (opcional)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ''}
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Inscrição — Rápidos FC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="payerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Silva" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de parcelas</FormLabel>
                    <FormControl>
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className={SELECT_CLASS}
                      >
                        <option value="">Sem limite (padrão MP)</option>
                        {[1, 2, 3, 4, 6, 12].map((n) => (
                          <option key={n} value={n}>{n}x</option>
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
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting
                    ? <Loader2 className="size-4 animate-spin" />
                    : <ShoppingCart className="size-4" />}
                  {isSubmitting ? 'Gerando...' : 'Gerar link de pagamento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
