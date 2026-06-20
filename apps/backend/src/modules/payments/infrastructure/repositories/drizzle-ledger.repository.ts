import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { LedgerEntryEntity } from '../../domain/entities/ledger-entry.entity'
import { IncomeCategory } from '../../domain/enums'
import {
  CreateLedgerEntryData,
  ILedgerRepository,
  LedgerSummary,
} from '../../domain/repositories/i-ledger.repository'

interface LedgerRow {
  id: string
  transaction_id: string
  championship_id: string | null
  category: string
  amount: number
  description: string
  created_at: Date
}

interface SummaryRow {
  category: string
  count: string
  total: string
}

function toEntity(r: LedgerRow): LedgerEntryEntity {
  return new LedgerEntryEntity(
    r.id, r.transaction_id, r.championship_id,
    r.category as IncomeCategory, r.amount, r.description, r.created_at,
  )
}

@Injectable()
export class DrizzleLedgerRepository implements ILedgerRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateLedgerEntryData): Promise<LedgerEntryEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<LedgerRow[]>`
        INSERT INTO ledger_entries (transaction_id, championship_id, category, amount, description)
        VALUES (${data.transactionId}, ${data.championshipId ?? null}, ${data.category}, ${data.amount}, ${data.description})
        RETURNING id, transaction_id, championship_id, category, amount, description, created_at
      `,
    )
    return toEntity(rows[0])
  }

  async findByChampionshipId(championshipId: string): Promise<LedgerEntryEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<LedgerRow[]>`SELECT id, transaction_id, championship_id, category, amount, description, created_at FROM ledger_entries WHERE championship_id = ${championshipId} ORDER BY created_at DESC`,
    )
    return rows.map(toEntity)
  }

  async getSummaryByChampionship(championshipId: string): Promise<LedgerSummary[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SummaryRow[]>`
        SELECT category, COUNT(*)::text AS count, SUM(amount)::text AS total
        FROM ledger_entries
        WHERE championship_id = ${championshipId}
        GROUP BY category
      `,
    )
    return rows.map((r) => ({
      category: r.category as IncomeCategory,
      count: parseInt(r.count, 10),
      total: parseInt(r.total, 10),
    }))
  }
}
