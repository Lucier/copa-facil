import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { RefundTransactionUseCase } from '../application/use-cases/refund-transaction.use-case'
import { TRANSACTION_REPOSITORY } from '../domain/repositories/i-transaction.repository'
import { PAYMENT_GATEWAY } from '../domain/gateways/i-payment-gateway'
import { AUDIT_REPOSITORY } from '../../auth/domain/repositories/i-audit.repository'
import { TransactionStatus } from '../domain/enums'
import { NotFoundError, AppError } from '../../../shared/errors'

const PAID_TX = { id: 'tx-1', status: TransactionStatus.PAID, gatewayTransactionId: 'gw-1' }
const PENDING_TX = { id: 'tx-2', status: TransactionStatus.PENDING, gatewayTransactionId: 'gw-2' }

describe('RefundTransactionUseCase', () => {
  let useCase: RefundTransactionUseCase
  let txRepo: { findById: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }
  let gateway: { refund: ReturnType<typeof vi.fn> }
  let audit: { log: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    txRepo = {
      findById: vi.fn().mockResolvedValue(PAID_TX),
      updateStatus: vi.fn().mockResolvedValue({ ...PAID_TX, status: TransactionStatus.REFUNDED }),
    }
    gateway = { refund: vi.fn().mockResolvedValue(undefined) }
    audit = { log: vi.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
        { provide: AUDIT_REPOSITORY, useValue: audit },
      ],
    }).compile()

    useCase = module.get<RefundTransactionUseCase>(RefundTransactionUseCase)
  })

  it('refunds a PAID transaction successfully', async () => {
    const result = await useCase.execute('tx-1', { amount: 100 }, 'admin-uid')
    expect(gateway.refund).toHaveBeenCalledWith(expect.objectContaining({ gatewayTransactionId: 'gw-1', amount: 100 }))
    expect(txRepo.updateStatus).toHaveBeenCalledWith('tx-1', TransactionStatus.REFUNDED)
    expect(result.status).toBe(TransactionStatus.REFUNDED)
  })

  it('logs audit action after refund', async () => {
    await useCase.execute('tx-1', { amount: 100 }, 'admin-uid')
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'transaction.refund', resourceId: 'tx-1' }))
  })

  it('throws NotFoundError when transaction does not exist', async () => {
    txRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { amount: 100 }, 'uid')).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when transaction is not PAID', async () => {
    txRepo.findById.mockResolvedValue(PENDING_TX)
    const err = await useCase.execute('tx-2', { amount: 100 }, 'uid').catch((e) => e)
    expect((err as AppError).code).toBe('INVALID_STATE')
  })

  it('throws INVALID_STATE when transaction has no gateway reference', async () => {
    txRepo.findById.mockResolvedValue({ ...PAID_TX, gatewayTransactionId: null })
    const err = await useCase.execute('tx-1', { amount: 100 }, 'uid').catch((e) => e)
    expect((err as AppError).code).toBe('INVALID_STATE')
  })
})
