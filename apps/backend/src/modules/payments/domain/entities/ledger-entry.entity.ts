import { IncomeCategory } from '../enums'

export class LedgerEntryEntity {
  constructor(
    public readonly id: string,
    public readonly transactionId: string,
    public readonly championshipId: string | null,
    public readonly category: IncomeCategory,
    public readonly amount: number,
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}
}
