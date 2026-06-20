import { Inject, Injectable } from '@nestjs/common'
import { AppError, NotFoundError } from '../../../../shared/errors'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import { TransactionStatus } from '../../domain/enums'
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from '../../domain/gateways/i-payment-gateway'
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'
import { RefundTransactionDto } from '../dtos/refund-transaction.dto'

@Injectable()
export class RefundTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  async execute(id: string, dto: RefundTransactionDto): Promise<TransactionEntity> {
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

    return this.txRepo.updateStatus(id, TransactionStatus.REFUNDED)
  }
}
