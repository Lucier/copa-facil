'use client'
import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet, TrendingUp, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreatePaymentDialog } from '@/components/admin/CreatePaymentDialog'
import { RefundDialog } from '@/components/admin/RefundDialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'live' | 'destructive' | 'outline' }> = {
  pending:    { label: 'Pendente',    variant: 'outline' },
  processing: { label: 'Processando', variant: 'warning' },
  paid:       { label: 'Pago',        variant: 'success' },
  failed:     { label: 'Falhou',      variant: 'destructive' },
  refunded:   { label: 'Reembolsado', variant: 'default' },
}

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão',
}

const CATEGORY_LABELS: Record<string, string> = {
  inscricao: 'Inscrição',
  patrocinio: 'Patrocínio',
  receita_avulsa: 'Avulsa',
}

interface Championship { id: string; name: string; season: string }

interface Transaction {
  id: string
  championshipId: string | null
  referenceId: string | null
  referenceType: string | null
  amount: number
  currency: string
  method: string
  category: string
  status: string
  gatewayTransactionId: string | null
  payerId: string | null
  paidAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  description?: string
}

interface LedgerSummary {
  category: string
  count: number
  total: number
}

interface RefundTarget {
  id: string
  description: string
  amount: number
}

export default function PaymentsPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState<string>('')
  const [refundTarget, setRefundTarget] = React.useState<RefundTarget | null>(null)

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data } = await api.get(API.championships.base)
      return data as Championship[]
    },
  })

  const { data: transactions = [], isLoading, isError } = useQuery<Transaction[]>({
    queryKey: ['payments', selectedChampId],
    queryFn: async () => {
      const url = selectedChampId
        ? `${API.payments.base}?championshipId=${selectedChampId}`
        : API.payments.base
      const { data } = await api.get(url)
      return data as Transaction[]
    },
    enabled: championships.length > 0 || !selectedChampId,
  })

  const { data: ledger = [] } = useQuery<LedgerSummary[]>({
    queryKey: ['payments-ledger', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.payments.ledger(selectedChampId))
      return data as LedgerSummary[]
    },
    enabled: Boolean(selectedChampId),
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    queryClient.invalidateQueries({ queryKey: ['payments-ledger', selectedChampId] })
  }

  const totalReceived = ledger.reduce((s, l) => s + l.total, 0)
  const paidCount = transactions.filter((t) => t.status === 'paid').length
  const pendingCount = transactions.filter((t) => t.status === 'pending' || t.status === 'processing').length

  const selectedChamp = championships.find((c) => c.id === selectedChampId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Pagamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie cobranças e o ledger financeiro dos campeonatos.</p>
        </div>
        <CreatePaymentDialog
          championships={championships}
          defaultChampionshipId={selectedChampId || undefined}
          onSuccess={handleSuccess}
        >
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Nova Cobrança
          </Button>
        </CreatePaymentDialog>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Campeonato:</label>
        <select
          value={selectedChampId}
          onChange={(e) => setSelectedChampId((e.target as HTMLSelectElement).value)}
          className={SELECT_CLASS}
        >
          <option value="">Todos os Campeonatos</option>
          {championships.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
          ))}
        </select>
      </div>

      {/* Ledger summary */}
      {ledger.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {ledger.map((entry) => (
            <Card key={entry.category}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {CATEGORY_LABELS[entry.category] ?? entry.category}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-primary">
                  {formatCurrency(entry.total)}
                </p>
                <p className="text-xs text-muted-foreground">{entry.count} transação(ões)</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Arrecadado', value: formatCurrency(totalReceived), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Pagamentos Confirmados', value: paidCount, icon: Wallet, color: 'text-primary' },
          { label: 'Aguardando Pagamento', value: pendingCount, icon: RotateCcw, color: 'text-amber-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`size-8 ${s.color}`} />
              <div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {selectedChamp
              ? `Transações — ${selectedChamp.name} (${selectedChamp.season})`
              : 'Todas as Transações'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {!isLoading && isError && (
            <p className="p-6 text-center text-sm text-destructive">Erro ao carregar transações.</p>
          )}
          {!isLoading && !isError && transactions.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {selectedChampId ? 'Nenhuma transação neste campeonato ainda.' : 'Nenhuma transação encontrada.'}
            </p>
          )}
          {!isLoading && transactions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição / ID Gateway</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const st = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div>
                          {tx.description && (
                            <p className="text-sm font-medium">{tx.description}</p>
                          )}
                          {tx.gatewayTransactionId && (
                            <p className="font-mono text-[10px] text-muted-foreground">{tx.gatewayTransactionId}</p>
                          )}
                          {!tx.description && !tx.gatewayTransactionId && (
                            <span className="text-xs text-muted-foreground">{tx.id.slice(0, 8)}…</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {METHOD_LABELS[tx.method] ?? tx.method}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[tx.category] ?? tx.category}
                      </TableCell>
                      <TableCell className="text-right font-display font-bold text-sm">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.paidAt ? formatDateTime(tx.paidAt) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.status === 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive gap-1"
                            onClick={() => setRefundTarget({
                              id: tx.id,
                              description: tx.description ?? tx.gatewayTransactionId ?? tx.id,
                              amount: tx.amount,
                            })}
                          >
                            <RotateCcw className="size-3" />
                            Reembolsar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RefundDialog
        transaction={refundTarget}
        onSuccess={handleSuccess}
        onClose={() => setRefundTarget(null)}
      />
    </div>
  )
}
