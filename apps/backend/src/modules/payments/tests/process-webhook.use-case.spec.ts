import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ProcessWebhookUseCase } from '../application/use-cases/process-webhook.use-case'
import { TRANSACTION_REPOSITORY } from '../domain/repositories/i-transaction.repository'
import { LEDGER_REPOSITORY } from '../domain/repositories/i-ledger.repository'
import { PAYMENT_GATEWAY } from '../domain/gateways/i-payment-gateway'
import { TransactionStatus, IncomeCategory } from '../domain/enums'
import { WebhookEventType } from '../application/dtos/process-webhook.dto'
import { AppError } from '../../../shared/errors'

const PENDING_TX = { id: 'tx-1', status: TransactionStatus.PENDING, amount: 100, method: 'pix', category: IncomeCategory.INSCRICAO, championshipId: 'c1' }

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase
  let txRepo: { findByGatewayId: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }
  let ledgerRepo: { create: ReturnType<typeof vi.fn> }
  let gateway: { verifyWebhookSignature: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    txRepo = {
      findByGatewayId: vi.fn().mockResolvedValue(PENDING_TX),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    }
    ledgerRepo = { create: vi.fn().mockResolvedValue(undefined) }
    gateway = { verifyWebhookSignature: vi.fn().mockReturnValue(true) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessWebhookUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
        { provide: LEDGER_REPOSITORY, useValue: ledgerRepo },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
      ],
    }).compile()

    useCase = module.get<ProcessWebhookUseCase>(ProcessWebhookUseCase)
  })

  it('rejects webhook with invalid signature (401)', async () => {
    gateway.verifyWebhookSignature.mockReturnValue(false)
    const err = await useCase.execute(
      { event: WebhookEventType.PAYMENT_PAID, gatewayTransactionId: 'gw-1' },
      'tenant_test',
      Buffer.from('payload'),
      'bad-sig',
    ).catch((e) => e)
    expect((err as AppError).statusCode).toBe(401)
  })

  it('updates transaction to PAID and creates LedgerEntry on PAYMENT_PAID', async () => {
    await useCase.execute(
      { event: WebhookEventType.PAYMENT_PAID, gatewayTransactionId: 'gw-1' },
      'tenant_test',
      Buffer.from('payload'),
      'valid-sig',
    )
    expect(txRepo.updateStatus).toHaveBeenCalledWith('tx-1', TransactionStatus.PAID, expect.any(Date))
    expect(ledgerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 'tx-1', championshipId: 'c1' }))
  })

  it('updates transaction to FAILED on PAYMENT_FAILED without creating ledger entry', async () => {
    await useCase.execute(
      { event: WebhookEventType.PAYMENT_FAILED, gatewayTransactionId: 'gw-1' },
      'tenant_test',
      Buffer.from('payload'),
      'valid-sig',
    )
    expect(txRepo.updateStatus).toHaveBeenCalledWith('tx-1', TransactionStatus.FAILED)
    expect(ledgerRepo.create).not.toHaveBeenCalled()
  })

  it('silently ignores webhook for unknown gateway transaction id', async () => {
    txRepo.findByGatewayId.mockResolvedValue(null)
    await expect(useCase.execute(
      { event: WebhookEventType.PAYMENT_PAID, gatewayTransactionId: 'unknown' },
      'tenant_test',
      Buffer.from('payload'),
      'valid-sig',
    )).resolves.not.toThrow()
    expect(txRepo.updateStatus).not.toHaveBeenCalled()
    expect(ledgerRepo.create).not.toHaveBeenCalled()
  })
})
