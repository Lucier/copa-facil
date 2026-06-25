'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet, TrendingUp, RotateCcw, TrendingDown, DollarSign, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
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

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  custo_operacional: 'Custo Operacional',
  premiacao: 'Premiação',
  arbitragem: 'Arbitragem',
  multa: 'Multa',
  marketing: 'Marketing',
  instalacoes: 'Instalações',
  outros: 'Outros',
}

const EXPENSE_CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

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

interface Expense {
  id: string
  championshipId: string | null
  category: string
  amount: number
  description: string
  notes: string | null
  expenseDate: string
  createdAt: string
}

interface FinancialDashboard {
  income: { category: string; total: number; count: number }[]
  expenses: { category: string; total: number; count: number }[]
  totalIncome: number
  totalExpenses: number
  netResult: number
}

interface RefundTarget {
  id: string
  description: string
  amount: number
}

function AddExpenseDialog({ championships, defaultChampionshipId, onSuccess }: {
  championships: Championship[]
  defaultChampionshipId?: string
  onSuccess: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [champId, setChampId] = React.useState(defaultChampionshipId ?? '')
  const [category, setCategory] = React.useState('custo_operacional')
  const [amount, setAmount] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10))

  const mutation = useMutation({
    mutationFn: () => api.post(API.expenses.create, {
      championshipId: champId || undefined,
      category,
      amount: Math.round(parseFloat(amount) * 100),
      description: description.trim(),
      notes: notes.trim() || undefined,
      expenseDate,
    }),
    onSuccess: () => {
      setOpen(false)
      setAmount('')
      setDescription('')
      setNotes('')
      onSuccess()
    },
  })

  const valid = amount && parseFloat(amount) > 0 && description.trim()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <TrendingDown className="size-4" />Lançar Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Lançar Despesa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Campeonato (opcional)</Label>
            <select value={champId} onChange={(e) => setChampId(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">Sem campeonato</option>
              {championships.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" className="mt-1" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" className="mt-1" value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel do campo rodada 5" />
          </div>
          <div>
            <Label>Observações (opcional)</Label>
            <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Salvando...' : 'Lançar Despesa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.expenses.list(selectedChampId || undefined))
      return data as Expense[]
    },
  })

  const { data: financialDashboard } = useQuery<FinancialDashboard>({
    queryKey: ['financial-dashboard', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.expenses.dashboard(selectedChampId))
      return data as FinancialDashboard
    },
    enabled: Boolean(selectedChampId),
  })

  const deleteExpense = useMutation({
    mutationFn: (id: string) => api.delete(API.expenses.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard', selectedChampId] })
    },
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    queryClient.invalidateQueries({ queryKey: ['payments-ledger', selectedChampId] })
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    queryClient.invalidateQueries({ queryKey: ['financial-dashboard', selectedChampId] })
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
        <div className="flex gap-2">
          <AddExpenseDialog
            championships={championships}
            defaultChampionshipId={selectedChampId || undefined}
            onSuccess={handleSuccess}
          />
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

      {/* P&L Financial Dashboard */}
      {selectedChampId && financialDashboard && (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg">Painel Financeiro</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total de Receitas', value: formatCurrency(financialDashboard.totalIncome), icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Total de Despesas', value: formatCurrency(financialDashboard.totalExpenses), icon: TrendingDown, color: 'text-red-400' },
              {
                label: 'Resultado Líquido',
                value: formatCurrency(financialDashboard.netResult),
                icon: DollarSign,
                color: financialDashboard.netResult >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <s.icon className={`size-8 ${s.color}`} />
                  <div>
                    <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {financialDashboard.expenses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {financialDashboard.expenses.map((entry) => (
                <Card key={entry.category}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category}
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-red-400">
                      {formatCurrency(entry.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.count} lançamento(s)</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Despesas{selectedChamp ? ` — ${selectedChamp.name}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma despesa lançada{selectedChampId ? ' neste campeonato' : ''}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{exp.description}</p>
                        {exp.notes && <p className="text-xs text-muted-foreground">{exp.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(exp.expenseDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-display font-bold text-sm text-red-400">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={() => deleteExpense.mutate(exp.id)}
                      >
                        <Trash2 className="size-3" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
