import { Inject, Injectable, Logger } from '@nestjs/common'
import { AppError } from '../../../../shared/errors'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { TransactionStatus } from '../../domain/enums'
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from '../../domain/gateways/i-payment-gateway'
import {
  ILedgerRepository,
  LEDGER_REPOSITORY,
} from '../../domain/repositories/i-ledger.repository'
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'
import { ProcessWebhookDto, WebhookEventType } from '../dtos/process-webhook.dto'

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name)

  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    @Inject(LEDGER_REPOSITORY) private readonly ledgerRepo: ILedgerRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  async execute(
    dto: ProcessWebhookDto,
    tenantSchema: string,
    rawPayload: Buffer,
    signature: string,
    xRequestId?: string,
    dataId?: string,
  ): Promise<void> {
    if (!this.gateway.verifyWebhookSignature(rawPayload, signature, xRequestId, dataId)) {
      throw new AppError('Invalid webhook signature', 'UNAUTHORIZED', 401)
    }

    await TenantContext.run(tenantSchema, async () => {
      try {
        const tx = await this.txRepo.findByGatewayId(dto.gatewayTransactionId)
        if (!tx) {
          this.logger.warn(`Webhook for unknown gateway tx: ${dto.gatewayTransactionId}`)
          return
        }

        if (dto.event === WebhookEventType.PAYMENT_PAID) {
          const paidAt = new Date()
          await this.txRepo.updateStatus(tx.id, TransactionStatus.PAID, paidAt)
          await this.ledgerRepo.create({
            transactionId: tx.id,
            championshipId: tx.championshipId,
            category: tx.category,
            amount: tx.amount,
            description: `Payment received — ${tx.method} — ${tx.id}`,
          })
        } else if (dto.event === WebhookEventType.PAYMENT_FAILED) {
          await this.txRepo.updateStatus(tx.id, TransactionStatus.FAILED)
        } else if (dto.event === WebhookEventType.PAYMENT_REFUNDED) {
          await this.txRepo.updateStatus(tx.id, TransactionStatus.REFUNDED)
        }
      } catch (err) {
        this.logger.error('ProcessWebhookUseCase failed', err)
        throw err
      }
    })
  }
}
