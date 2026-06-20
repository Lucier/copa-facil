import { IncomeCategory } from '../enums'
import { LedgerEntryEntity } from '../entities/ledger-entry.entity'

export interface CreateLedgerEntryData {
  transactionId: string
  championshipId?: string | null
  category: IncomeCategory
  amount: number
  description: string
}

export interface LedgerSummary {
  category: IncomeCategory
  count: number
  total: number
}

export interface ILedgerRepository {
  create(data: CreateLedgerEntryData): Promise<LedgerEntryEntity>
  findByChampionshipId(championshipId: string): Promise<LedgerEntryEntity[]>
  getSummaryByChampionship(championshipId: string): Promise<LedgerSummary[]>
}

export const LEDGER_REPOSITORY = 'LEDGER_REPOSITORY'
