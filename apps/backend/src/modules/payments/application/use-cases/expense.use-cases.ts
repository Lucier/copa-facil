import { Injectable } from '@nestjs/common'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'

/* ─── Enum ─── */

export enum ExpenseCategory {
  CUSTO_OPERACIONAL = 'custo_operacional',
  PREMIACAO         = 'premiacao',
  ARBITRAGEM        = 'arbitragem',
  MULTA             = 'multa',
  MARKETING         = 'marketing',
  INSTALACOES       = 'instalacoes',
  OUTROS            = 'outros',
}

/* ─── DTO ─── */

export class CreateExpenseDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() championshipId?: string
  @ApiProperty({ enum: ExpenseCategory }) @IsEnum(ExpenseCategory) category!: ExpenseCategory
  @ApiProperty() @IsInt() @Min(1) amount!: number
  @ApiProperty() @IsString() description!: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() expenseDate?: string
}

/* ─── Entity ─── */

export interface ExpenseEntryDto {
  id: string
  championshipId: string | null
  category: string
  amount: number
  description: string
  notes: string | null
  expenseDate: string
  createdAt: string
}

interface ExpenseRow {
  id: string
  championship_id: string | null
  category: string
  amount: number
  description: string
  notes: string | null
  expense_date: string
  created_at: Date
}

function toDto(r: ExpenseRow): ExpenseEntryDto {
  return {
    id: r.id,
    championshipId: r.championship_id,
    category: r.category,
    amount: r.amount,
    description: r.description,
    notes: r.notes,
    expenseDate: r.expense_date,
    createdAt: r.created_at.toISOString(),
  }
}

/* ─── Use Cases ─── */

@Injectable()
export class CreateExpenseUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(dto: CreateExpenseDto): Promise<ExpenseEntryDto> {
    const date = dto.expenseDate ?? new Date().toISOString().slice(0, 10)
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ExpenseRow[]>`
        INSERT INTO expense_entries (championship_id, category, amount, description, notes, expense_date)
        VALUES (${dto.championshipId ?? null}, ${dto.category}, ${dto.amount}, ${dto.description},
                ${dto.notes ?? null}, ${date}::date)
        RETURNING *
      `,
    )
    return toDto(rows[0])
  }
}

@Injectable()
export class ListExpensesUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId?: string): Promise<ExpenseEntryDto[]> {
    const rows = await this.drizzle.runInTenantContext((tx) => {
      if (championshipId) {
        return tx<ExpenseRow[]>`
          SELECT * FROM expense_entries WHERE championship_id = ${championshipId} ORDER BY expense_date DESC, created_at DESC
        `
      }
      return tx<ExpenseRow[]>`SELECT * FROM expense_entries ORDER BY expense_date DESC, created_at DESC`
    })
    return rows.map(toDto)
  }
}

@Injectable()
export class DeleteExpenseUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(id: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) =>
      tx`DELETE FROM expense_entries WHERE id = ${id}`,
    )
  }
}

/* ─── Financial Dashboard ─── */

export interface FinancialDashboardDto {
  income: { category: string; total: number; count: number }[]
  expenses: { category: string; total: number; count: number }[]
  totalIncome: number
  totalExpenses: number
  netResult: number
}

@Injectable()
export class GetFinancialDashboardUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId: string): Promise<FinancialDashboardDto> {
    const [incomeRows, expenseRows] = await this.drizzle.runInTenantContext(async (tx) => {
      const income = await tx<{ category: string; total: string; count: string }[]>`
        SELECT category, SUM(amount)::text AS total, COUNT(*)::text AS count
        FROM ledger_entries
        WHERE championship_id = ${championshipId}
        GROUP BY category
      `
      const expenses = await tx<{ category: string; total: string; count: string }[]>`
        SELECT category, SUM(amount)::text AS total, COUNT(*)::text AS count
        FROM expense_entries
        WHERE championship_id = ${championshipId}
        GROUP BY category
      `
      return [income, expenses]
    })

    const income = incomeRows.map((r) => ({
      category: r.category,
      total: parseInt(r.total, 10),
      count: parseInt(r.count, 10),
    }))
    const expenses = expenseRows.map((r) => ({
      category: r.category,
      total: parseInt(r.total, 10),
      count: parseInt(r.count, 10),
    }))

    const totalIncome = income.reduce((s, r) => s + r.total, 0)
    const totalExpenses = expenses.reduce((s, r) => s + r.total, 0)

    return { income, expenses, totalIncome, totalExpenses, netResult: totalIncome - totalExpenses }
  }
}
