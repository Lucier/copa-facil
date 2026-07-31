import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppError } from '../../../../shared/errors'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import { IncomeCategory, PaymentMethodType } from '../../domain/enums'
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from '../../domain/gateways/i-payment-gateway'
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'
import { CreateCheckoutProDto } from '../dtos/create-checkout-pro.dto'

@Injectable()
export class CreateCheckoutProPreferenceUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: CreateCheckoutProDto, payerId: string, tenantSlug: string): Promise<TransactionEntity> {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    if (totalAmount <= 0) {
      throw new AppError('Total amount must be greater than zero', 'VALIDATION_ERROR', 422)
    }

    // Create the transaction first so we have an ID for external_reference
    const tx = await this.txRepo.create({
      championshipId: dto.championshipId,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      amount: totalAmount,
      currency: 'BRL',
      method: PaymentMethodType.CHECKOUT_PRO,
      category: dto.category as IncomeCategory,
      payerId,
    })

    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3001'
    const notificationUrl = `${appUrl}/api/v1/webhooks/mercadopago?tenantId=${tenantSlug}`

    const pref = await this.gateway.createCheckoutProPreference({
      items: dto.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      payer: {
        email: dto.payerEmail,
        lastName: dto.payerLastName,
      },
      backUrls: dto.backUrls,
      notificationUrl,
      externalReference: tx.id,
      statementDescriptor: dto.statementDescriptor,
      binaryMode: dto.binaryMode,
      maxInstallments: dto.maxInstallments,
      excludedPaymentMethods: dto.excludedPaymentMethods,
      excludedPaymentTypes: dto.excludedPaymentTypes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    })

    return this.txRepo.updateGatewayData(tx.id, pref.preferenceId, {
      preferenceId: pref.preferenceId,
      initPoint: pref.initPoint,
      sandboxInitPoint: pref.sandboxInitPoint,
    })
  }
}
