import { Inject, Injectable } from '@nestjs/common'
import { AppError, NotFoundError } from '../../../../shared/errors'
import {
  IAuditRepository} from '../../../auth/domain/repositories/i-audit.repository'
import {
  AUDIT_REPOSITORY
} from '../../../auth/domain/repositories/i-audit.repository'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import { TransactionStatus } from '../../domain/enums'
import {
  IPaymentGateway} from '../../domain/gateways/i-payment-gateway'
import {
  PAYMENT_GATEWAY,
} from '../../domain/gateways/i-payment-gateway'
import {
  ITransactionRepository} from '../../domain/repositories/i-transaction.repository'
import {
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'
import { RefundTransactionDto } from '../dtos/refund-transaction.dto'

@Injectable()
export class RefundTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
  ) {}

  async execute(id: string, dto: RefundTransactionDto, userId: string): Promise<TransactionEntity> {
    const tx = await this.txRepo.findById(id)
    if (!tx) throw new NotFoundError('Transaction', id)

    if (tx.status !== TransactionStatus.PAID) {
      throw new AppError('Only PAID transactions can be refunded', 'INVALID_STATE', 422)
    }
    if (!tx.gatewayTransactionId) {
      throw new AppError('Transaction has no gateway reference', 'INVALID_STATE', 422)
    }

    await this.gateway.refund({
      gatewayTransactionId: tx.gatewayTransactionId,
      amount: dto.amount,
    })

    const refunded = await this.txRepo.updateStatus(id, TransactionStatus.REFUNDED)

    await this.audit.log({
      userId,
      action: 'transaction.refund',
      resource: 'transaction',
      resourceId: id,
      metadata: { amount: dto.amount, gatewayTransactionId: tx.gatewayTransactionId },
    })

    return refunded
  }
}
