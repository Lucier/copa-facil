import { IncomeCategory, PaymentMethodType, TransactionStatus } from '../enums'

export class TransactionEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string | null,
    public readonly referenceId: string | null,
    public readonly referenceType: string | null,
    public readonly amount: number,
    public readonly currency: string,
    public readonly method: PaymentMethodType,
    public readonly category: IncomeCategory,
    public readonly status: TransactionStatus,
    public readonly gatewayTransactionId: string | null,
    public readonly gatewayPayload: Record<string, unknown> | null,
    public readonly payerId: string | null,
    public readonly paidAt: Date | null,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
