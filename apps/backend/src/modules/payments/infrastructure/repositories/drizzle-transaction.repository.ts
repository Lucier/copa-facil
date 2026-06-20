import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import { IncomeCategory, PaymentMethodType, TransactionStatus } from '../../domain/enums'
import {
  CreateTransactionData,
  ITransactionRepository,
} from '../../domain/repositories/i-transaction.repository'

interface TxRow {
  id: string
  championship_id: string | null
  reference_id: string | null
  reference_type: string | null
  amount: number
  currency: string
  method: string
  category: string
  status: string
  gateway_transaction_id: string | null
  gateway_payload: Record<string, unknown> | null
  payer_id: string | null
  paid_at: Date | null
  expires_at: Date | null
  created_at: Date
  updated_at: Date
}

function toEntity(r: TxRow): TransactionEntity {
  return new TransactionEntity(
    r.id, r.championship_id, r.reference_id, r.reference_type,
    r.amount, r.currency, r.method as PaymentMethodType,
    r.category as IncomeCategory, r.status as TransactionStatus,
    r.gateway_transaction_id, r.gateway_payload, r.payer_id,
    r.paid_at, r.expires_at, r.created_at, r.updated_at,
  )
}

@Injectable()
export class DrizzleTransactionRepository implements ITransactionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`SELECT id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at FROM transactions WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByGatewayId(gatewayTransactionId: string): Promise<TransactionEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`SELECT id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at FROM transactions WHERE gateway_transaction_id = ${gatewayTransactionId} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findAll(): Promise<TransactionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`SELECT id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at FROM transactions ORDER BY created_at DESC`,
    )
    return rows.map(toEntity)
  }

  async findByChampionshipId(championshipId: string): Promise<TransactionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`SELECT id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at FROM transactions WHERE championship_id = ${championshipId} ORDER BY created_at DESC`,
    )
    return rows.map(toEntity)
  }

  async create(data: CreateTransactionData): Promise<TransactionEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`
        INSERT INTO transactions (
          championship_id, reference_id, reference_type, amount, currency,
          method, category, payer_id, gateway_transaction_id, gateway_payload, expires_at
        )
        VALUES (
          ${data.championshipId ?? null}, ${data.referenceId ?? null}, ${data.referenceType ?? null},
          ${data.amount}, ${data.currency ?? 'BRL'}, ${data.method}, ${data.category},
          ${data.payerId ?? null}, ${data.gatewayTransactionId ?? null},
          ${data.gatewayPayload ? JSON.stringify(data.gatewayPayload) : null}::jsonb,
          ${data.expiresAt ? data.expiresAt.toISOString() : null}
        )
        RETURNING id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async updateStatus(id: string, status: TransactionStatus, paidAt?: Date | null): Promise<TransactionEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`
        UPDATE transactions SET
          status     = ${status},
          paid_at    = CASE WHEN ${paidAt !== undefined} THEN ${paidAt instanceof Date ? paidAt.toISOString() : null} ELSE paid_at END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async updateGatewayData(
    id: string,
    gatewayTransactionId: string,
    gatewayPayload: Record<string, unknown>,
  ): Promise<TransactionEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TxRow[]>`
        UPDATE transactions SET
          gateway_transaction_id = ${gatewayTransactionId},
          gateway_payload        = ${JSON.stringify(gatewayPayload)}::jsonb,
          updated_at             = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, reference_id, reference_type, amount, currency, method, category, status, gateway_transaction_id, gateway_payload, payer_id, paid_at, expires_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }
}
