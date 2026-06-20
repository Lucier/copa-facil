import { IncomeCategory, PaymentMethodType, TransactionStatus } from '../enums'
import { TransactionEntity } from '../entities/transaction.entity'

export interface CreateTransactionData {
  championshipId?: string | null
  referenceId?: string | null
  referenceType?: string | null
  amount: number
  currency?: string
  method: PaymentMethodType
  category: IncomeCategory
  payerId?: string | null
  gatewayTransactionId?: string | null
  gatewayPayload?: Record<string, unknown> | null
  expiresAt?: Date | null
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionEntity | null>
  findByGatewayId(gatewayTransactionId: string): Promise<TransactionEntity | null>
  findAll(): Promise<TransactionEntity[]>
  findByChampionshipId(championshipId: string): Promise<TransactionEntity[]>
  create(data: CreateTransactionData): Promise<TransactionEntity>
  updateStatus(
    id: string,
    status: TransactionStatus,
    paidAt?: Date | null,
  ): Promise<TransactionEntity>
  updateGatewayData(
    id: string,
    gatewayTransactionId: string,
    gatewayPayload: Record<string, unknown>,
  ): Promise<TransactionEntity>
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY'
