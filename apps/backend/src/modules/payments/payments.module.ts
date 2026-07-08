import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MercadoPagoConfig } from 'mercadopago'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { AUDIT_REPOSITORY } from '../auth/domain/repositories/i-audit.repository'
import { DrizzleAuditRepository } from '../auth/infrastructure/repositories/drizzle-audit.repository'
import { EncryptionService } from '../../infrastructure/encryption/encryption.service'
import { PAYMENT_GATEWAY } from './domain/gateways/i-payment-gateway'
import { LEDGER_REPOSITORY } from './domain/repositories/i-ledger.repository'
import { TRANSACTION_REPOSITORY } from './domain/repositories/i-transaction.repository'
import { CreatePaymentOrderUseCase } from './application/use-cases/create-payment-order.use-case'
import { GetLedgerSummaryUseCase } from './application/use-cases/get-ledger-summary.use-case'
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case'
import { ProcessWebhookUseCase } from './application/use-cases/process-webhook.use-case'
import { RefundTransactionUseCase } from './application/use-cases/refund-transaction.use-case'
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  GetFinancialDashboardUseCase,
  ListExpensesUseCase,
} from './application/use-cases/expense.use-cases'
import { MercadoPagoPaymentGatewayAdapter } from './infrastructure/adapters/mercadopago-payment-gateway.adapter'
import { MockPaymentGatewayAdapter } from './infrastructure/adapters/mock-payment-gateway.adapter'
import { DrizzleLedgerRepository } from './infrastructure/repositories/drizzle-ledger.repository'
import { DrizzleTransactionRepository } from './infrastructure/repositories/drizzle-transaction.repository'
import { PaymentsController } from './presentation/controllers/payments.controller'
import { MercadoPagoWebhookController } from './presentation/webhooks/mercadopago-webhook.controller'
import { PaymentWebhooksController } from './presentation/webhooks/payment-webhooks.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (config: ConfigService) => {
        const accessToken = config.get<string>('MP_ACCESS_TOKEN')
        if (accessToken) {
          const mpConfig = new MercadoPagoConfig({ accessToken })
          return new MercadoPagoPaymentGatewayAdapter(
            mpConfig,
            config.get<string>('MP_WEBHOOK_SECRET'),
          )
        }
        if (config.get<string>('NODE_ENV') === 'production') {
          throw new Error(
            'MP_ACCESS_TOKEN is required in production — refusing to start with mock payment gateway',
          )
        }
        return new MockPaymentGatewayAdapter()
      },
      inject: [ConfigService],
    },
    { provide: TRANSACTION_REPOSITORY, useClass: DrizzleTransactionRepository },
    { provide: LEDGER_REPOSITORY, useClass: DrizzleLedgerRepository },
    { provide: AUDIT_REPOSITORY, useClass: DrizzleAuditRepository },
    EncryptionService,
    CreatePaymentOrderUseCase,
    ProcessWebhookUseCase,
    RefundTransactionUseCase,
    ListTransactionsUseCase,
    GetLedgerSummaryUseCase,
    CreateExpenseUseCase,
    ListExpensesUseCase,
    DeleteExpenseUseCase,
    GetFinancialDashboardUseCase,
  ],
  controllers: [PaymentsController, PaymentWebhooksController, MercadoPagoWebhookController],
})
export class PaymentsModule {}
