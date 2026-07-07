import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { CreatePaymentOrderUseCase } from '../application/use-cases/create-payment-order.use-case'
import { TRANSACTION_REPOSITORY } from '../domain/repositories/i-transaction.repository'
import { PAYMENT_GATEWAY } from '../domain/gateways/i-payment-gateway'
import { PaymentMethodType, TransactionStatus, IncomeCategory } from '../domain/enums'

function makeBase() {
  return {
    championshipId: 'c1',
    referenceId: 'ref-1',
    referenceType: 'registration' as const,
    amount: 100,
    currency: 'BRL',
    description: 'Taxa de inscrição',
    category: IncomeCategory.INSCRICAO,
    payerEmail: 'payer@test.com',
  }
}

const PENDING_TX = { id: 'tx-1', status: TransactionStatus.PENDING }
const PAID_TX = { id: 'tx-1', status: TransactionStatus.PAID }

describe('CreatePaymentOrderUseCase', () => {
  let useCase: CreatePaymentOrderUseCase
  let txRepo: { create: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }
  let gateway: {
    createPix: ReturnType<typeof vi.fn>
    createBoleto: ReturnType<typeof vi.fn>
    chargeCreditCard: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    txRepo = {
      create: vi.fn().mockResolvedValue(PENDING_TX),
      updateStatus: vi.fn().mockResolvedValue(PAID_TX),
    }
    gateway = {
      createPix: vi.fn().mockResolvedValue({ transactionId: 'gw-pix', qrCode: 'qr', copyPasteCode: 'pix123', expiresAt: new Date() }),
      createBoleto: vi.fn().mockResolvedValue({ transactionId: 'gw-bol', barcodeString: 'bar', pdfUrl: 'http://pdf', dueDate: new Date() }),
      chargeCreditCard: vi.fn().mockResolvedValue({ transactionId: 'gw-cc', authorizationCode: 'auth', capturedAt: new Date() }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentOrderUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
      ],
    }).compile()

    useCase = module.get<CreatePaymentOrderUseCase>(CreatePaymentOrderUseCase)
  })

  it('creates PIX payment via gateway and returns PENDING transaction', async () => {
    const result = await useCase.execute({ ...makeBase(), method: PaymentMethodType.PIX }, 'payer-uid')
    expect(gateway.createPix).toHaveBeenCalledOnce()
    expect(txRepo.create).toHaveBeenCalledWith(expect.objectContaining({ method: PaymentMethodType.PIX, gatewayTransactionId: 'gw-pix' }))
    expect(result.status).toBe(TransactionStatus.PENDING)
  })

  it('creates Boleto payment via gateway and returns PENDING transaction', async () => {
    await useCase.execute({
      ...makeBase(),
      method: PaymentMethodType.BOLETO,
      payerName: 'Fulano',
      payerDocument: '123.456.789-00',
      dueDate: '2026-12-31',
    }, 'payer-uid')
    expect(gateway.createBoleto).toHaveBeenCalledOnce()
    expect(txRepo.create).toHaveBeenCalledWith(expect.objectContaining({ method: PaymentMethodType.BOLETO, gatewayTransactionId: 'gw-bol' }))
  })

  it('creates credit card payment and auto-marks as PAID', async () => {
    const result = await useCase.execute({
      ...makeBase(),
      method: PaymentMethodType.CARTAO_CREDITO,
      cardToken: 'tok-123',
    }, 'payer-uid')
    expect(gateway.chargeCreditCard).toHaveBeenCalledOnce()
    expect(txRepo.updateStatus).toHaveBeenCalledWith('tx-1', TransactionStatus.PAID, expect.any(Date))
    expect(result.status).toBe(TransactionStatus.PAID)
  })

  it('throws VALIDATION_ERROR for boleto without required fields', async () => {
    const err = await useCase.execute({ ...makeBase(), method: PaymentMethodType.BOLETO }, 'uid').catch((e) => e)
    expect((err as any).code).toBe('VALIDATION_ERROR')
  })

  it('throws VALIDATION_ERROR for credit card without cardToken', async () => {
    const err = await useCase.execute({ ...makeBase(), method: PaymentMethodType.CARTAO_CREDITO }, 'uid').catch((e) => e)
    expect((err as any).code).toBe('VALIDATION_ERROR')
  })
})
