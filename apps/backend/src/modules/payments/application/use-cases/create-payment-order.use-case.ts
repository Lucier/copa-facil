import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import { PaymentMethodType, TransactionStatus } from '../../domain/enums'
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from '../../domain/gateways/i-payment-gateway'
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'
import { CreatePaymentOrderDto } from '../dtos/create-payment-order.dto'

@Injectable()
export class CreatePaymentOrderUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  async execute(dto: CreatePaymentOrderDto, payerId: string): Promise<TransactionEntity> {
    let gatewayTransactionId: string | null = null
    let gatewayPayload: Record<string, unknown> | null = null
    let expiresAt: Date | null = null

    if (dto.method === PaymentMethodType.PIX) {
      const res = await this.gateway.createPix({
        amount: dto.amount,
        description: dto.description,
        payerEmail: dto.payerEmail,
        ttlMinutes: dto.ttlMinutes,
      })
      gatewayTransactionId = res.transactionId
      gatewayPayload = { qrCode: res.qrCode, copyPasteCode: res.copyPasteCode }
      expiresAt = res.expiresAt
    } else if (dto.method === PaymentMethodType.BOLETO) {
      if (!dto.payerName || !dto.payerDocument || !dto.dueDate) {
        throw new AppError('Boleto requires payerName, payerDocument and dueDate', 'VALIDATION_ERROR', 422)
      }
      const res = await this.gateway.createBoleto({
        amount: dto.amount,
        description: dto.description,
        payerName: dto.payerName,
        payerDocument: dto.payerDocument,
        payerEmail: dto.payerEmail,
        payerZipCode: dto.payerZipCode,
        payerStreetName: dto.payerStreetName,
        payerCity: dto.payerCity,
        payerState: dto.payerState,
        dueDate: new Date(dto.dueDate),
      })
      gatewayTransactionId = res.transactionId
      gatewayPayload = { barcodeString: res.barcodeString, pdfUrl: res.pdfUrl }
      expiresAt = res.dueDate
    } else if (dto.method === PaymentMethodType.CARTAO_CREDITO) {
      if (!dto.cardToken) {
        throw new AppError('Credit card requires cardToken', 'VALIDATION_ERROR', 422)
      }
      const res = await this.gateway.chargeCreditCard({
        amount: dto.amount,
        description: dto.description,
        cardToken: dto.cardToken,
        installments: dto.installments,
        paymentMethodId: dto.paymentMethodId,
        issuerId: dto.issuerId,
        payerEmail: dto.payerEmail,
      })
      gatewayTransactionId = res.transactionId
      gatewayPayload = { authorizationCode: res.authorizationCode, capturedAt: res.capturedAt }
    }

    const tx = await this.txRepo.create({
      championshipId: dto.championshipId,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      amount: dto.amount,
      currency: 'BRL',
      method: dto.method,
      category: dto.category,
      payerId,
      gatewayTransactionId,
      gatewayPayload,
      expiresAt,
    })

    // Credit card payments are captured immediately
    if (dto.method === PaymentMethodType.CARTAO_CREDITO) {
      return this.txRepo.updateStatus(tx.id, TransactionStatus.PAID, new Date())
    }

    return tx
  }
}
