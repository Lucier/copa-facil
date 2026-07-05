import { describe, expect, it, vi } from 'vitest'
import { ListTransactionsUseCase } from '../application/use-cases/list-transactions.use-case'
import { GetLedgerSummaryUseCase } from '../application/use-cases/get-ledger-summary.use-case'
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  ExpenseCategory,
  GetFinancialDashboardUseCase,
  ListExpensesUseCase,
} from '../application/use-cases/expense.use-cases'
import type { DrizzleService } from '../../../database/drizzle.service'

// Fake tagged-template tx: records queries and returns queued results in order
function makeFakeDrizzle(results: unknown[][]) {
  const queries: { text: string; values: unknown[] }[] = []
  let call = 0
  const tx = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({ text: strings.join('?'), values })
    return Promise.resolve(results[call++] ?? [])
  }
  const drizzle = {
    runInTenantContext: (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
  } as unknown as DrizzleService
  return { drizzle, queries }
}

describe('ListTransactionsUseCase', () => {
  it('lists all when no championship filter', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([{ id: 't1' }]), findByChampionshipId: vi.fn() }
    const result = await new ListTransactionsUseCase(repo as never).execute()
    expect(result).toEqual([{ id: 't1' }])
    expect(repo.findByChampionshipId).not.toHaveBeenCalled()
  })

  it('filters by championship when provided', async () => {
    const repo = { findAll: vi.fn(), findByChampionshipId: vi.fn().mockResolvedValue([{ id: 't2' }]) }
    const result = await new ListTransactionsUseCase(repo as never).execute('champ-1')
    expect(repo.findByChampionshipId).toHaveBeenCalledWith('champ-1')
    expect(result).toEqual([{ id: 't2' }])
  })
})

describe('GetLedgerSummaryUseCase', () => {
  it('delegates to the ledger repository', async () => {
    const repo = { getSummaryByChampionship: vi.fn().mockResolvedValue([{ category: 'inscricao' }]) }
    const result = await new GetLedgerSummaryUseCase(repo as never).execute('champ-1')
    expect(repo.getSummaryByChampionship).toHaveBeenCalledWith('champ-1')
    expect(result).toEqual([{ category: 'inscricao' }])
  })
})

const expenseRow = {
  id: 'e-1',
  championship_id: 'champ-1',
  category: 'arbitragem',
  amount: 5000,
  description: 'Taxa de arbitragem',
  notes: null,
  expense_date: '2026-07-01',
  created_at: new Date('2026-07-01T10:00:00Z'),
}

describe('CreateExpenseUseCase', () => {
  it('inserts and maps the row to a DTO', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[expenseRow]])
    const result = await new CreateExpenseUseCase(drizzle).execute({
      championshipId: 'champ-1',
      category: ExpenseCategory.ARBITRAGEM,
      amount: 5000,
      description: 'Taxa de arbitragem',
      expenseDate: '2026-07-01',
    })
    expect(result).toEqual({
      id: 'e-1',
      championshipId: 'champ-1',
      category: 'arbitragem',
      amount: 5000,
      description: 'Taxa de arbitragem',
      notes: null,
      expenseDate: '2026-07-01',
      createdAt: '2026-07-01T10:00:00.000Z',
    })
    expect(queries[0].text).toContain('INSERT INTO expense_entries')
    expect(queries[0].values).toContain('arbitragem')
  })

  it('defaults expense date to today when omitted', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[expenseRow]])
    await new CreateExpenseUseCase(drizzle).execute({
      category: ExpenseCategory.OUTROS,
      amount: 100,
      description: 'Outro',
    })
    const today = new Date().toISOString().slice(0, 10)
    expect(queries[0].values).toContain(today)
    expect(queries[0].values).toContain(null) // championshipId
  })
})

describe('ListExpensesUseCase', () => {
  it('lists all expenses ordered', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[expenseRow]])
    const result = await new ListExpensesUseCase(drizzle).execute()
    expect(result).toHaveLength(1)
    expect(queries[0].text).not.toContain('WHERE')
  })

  it('filters by championship', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[expenseRow]])
    await new ListExpensesUseCase(drizzle).execute('champ-1')
    expect(queries[0].text).toContain('WHERE championship_id =')
    expect(queries[0].values).toContain('champ-1')
  })
})

describe('DeleteExpenseUseCase', () => {
  it('deletes by id', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[]])
    await new DeleteExpenseUseCase(drizzle).execute('e-1')
    expect(queries[0].text).toContain('DELETE FROM expense_entries')
    expect(queries[0].values).toEqual(['e-1'])
  })
})

describe('GetFinancialDashboardUseCase', () => {
  it('aggregates income and expenses into net result', async () => {
    const { drizzle } = makeFakeDrizzle([
      [
        { category: 'inscricao', total: '10000', count: '2' },
        { category: 'patrocinio', total: '50000', count: '1' },
      ],
      [{ category: 'arbitragem', total: '15000', count: '3' }],
    ])
    const result = await new GetFinancialDashboardUseCase(drizzle).execute('champ-1')
    expect(result.totalIncome).toBe(60000)
    expect(result.totalExpenses).toBe(15000)
    expect(result.netResult).toBe(45000)
    expect(result.income).toContainEqual({ category: 'inscricao', total: 10000, count: 2 })
  })

  it('handles championships with no entries', async () => {
    const { drizzle } = makeFakeDrizzle([[], []])
    const result = await new GetFinancialDashboardUseCase(drizzle).execute('champ-1')
    expect(result).toEqual({ income: [], expenses: [], totalIncome: 0, totalExpenses: 0, netResult: 0 })
  })
})
