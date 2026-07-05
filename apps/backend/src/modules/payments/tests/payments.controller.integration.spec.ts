import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { PaymentsController } from '../presentation/controllers/payments.controller'
import { CreatePaymentOrderUseCase } from '../application/use-cases/create-payment-order.use-case'
import { RefundTransactionUseCase } from '../application/use-cases/refund-transaction.use-case'
import { ListTransactionsUseCase } from '../application/use-cases/list-transactions.use-case'
import { GetLedgerSummaryUseCase } from '../application/use-cases/get-ledger-summary.use-case'
import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
  GetFinancialDashboardUseCase,
  ListExpensesUseCase,
} from '../application/use-cases/expense.use-cases'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'

const CHAMP_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const TX_ID = 'b1ffc099-1d0b-4ef8-bb6d-6bb9bd380b22'
const EXPENSE_ID = 'c2ffd199-2e0b-4ef8-bb6d-6bb9bd380c33'

const mocks = {
  createOrder: { execute: vi.fn().mockResolvedValue({ id: TX_ID, status: 'pending' }) },
  refund: { execute: vi.fn().mockResolvedValue({ id: TX_ID, status: 'refunded' }) },
  listTx: { execute: vi.fn().mockResolvedValue([{ id: TX_ID }]) },
  ledger: { execute: vi.fn().mockResolvedValue([{ category: 'inscricao', total: 10000 }]) },
  createExpense: { execute: vi.fn().mockResolvedValue({ id: EXPENSE_ID }) },
  listExpenses: { execute: vi.fn().mockResolvedValue([{ id: EXPENSE_ID }]) },
  deleteExpense: { execute: vi.fn().mockResolvedValue(undefined) },
  dashboard: { execute: vi.fn().mockResolvedValue({ totalIncome: 0, totalExpenses: 0, netResult: 0 }) },
}

const ORGANIZER = { sub: 'org-1', email: 'org@test.com', role: 'organizador', jti: 'jti-1' }
const TORCEDOR = { sub: 'tor-1', email: 'tor@test.com', role: 'torcedor', jti: 'jti-2' }

async function buildApp(user: typeof ORGANIZER): Promise<INestApplication> {
  const mod = await Test.createTestingModule({
    controllers: [PaymentsController],
    providers: [
      { provide: CreatePaymentOrderUseCase, useValue: mocks.createOrder },
      { provide: RefundTransactionUseCase, useValue: mocks.refund },
      { provide: ListTransactionsUseCase, useValue: mocks.listTx },
      { provide: GetLedgerSummaryUseCase, useValue: mocks.ledger },
      { provide: CreateExpenseUseCase, useValue: mocks.createExpense },
      { provide: ListExpensesUseCase, useValue: mocks.listExpenses },
      { provide: DeleteExpenseUseCase, useValue: mocks.deleteExpense },
      { provide: GetFinancialDashboardUseCase, useValue: mocks.dashboard },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = user
        return true
      },
    })
    .compile()

  const app = mod.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  await app.init()
  return app
}

describe('PaymentsController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(ORGANIZER)
  })

  afterAll(() => app.close())

  it('POST /payments creates a PIX order', async () => {
    const res = await request(app.getHttpServer()).post('/payments').send({
      amount: 10000,
      method: 'pix',
      category: 'inscricao',
      description: 'Taxa de inscrição',
    })
    expect(res.status).toBe(201)
    expect(mocks.createOrder.execute).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000, method: 'pix' }),
      ORGANIZER.sub,
    )
  })

  it('POST /payments rejects invalid method and non-positive amount', async () => {
    const bad1 = await request(app.getHttpServer())
      .post('/payments')
      .send({ amount: 100, method: 'dinheiro', category: 'inscricao', description: 'x' })
    const bad2 = await request(app.getHttpServer())
      .post('/payments')
      .send({ amount: 0, method: 'pix', category: 'inscricao', description: 'x' })
    expect(bad1.status).toBe(400)
    expect(bad2.status).toBe(400)
  })

  it('POST /payments/:id/refund refunds a transaction', async () => {
    const res = await request(app.getHttpServer()).post(`/payments/${TX_ID}/refund`).send({})
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('refunded')
  })

  it('POST /payments/:id/refund rejects non-UUID id', async () => {
    const res = await request(app.getHttpServer()).post('/payments/abc/refund').send({})
    expect(res.status).toBe(400)
  })

  it('GET /payments lists transactions with optional filter', async () => {
    const res = await request(app.getHttpServer()).get('/payments').query({ championshipId: CHAMP_ID })
    expect(res.status).toBe(200)
    expect(mocks.listTx.execute).toHaveBeenCalledWith(CHAMP_ID)
  })

  it('GET /payments/ledger/:championshipId returns the summary', async () => {
    const res = await request(app.getHttpServer()).get(`/payments/ledger/${CHAMP_ID}`)
    expect(res.status).toBe(200)
    expect(res.body[0].category).toBe('inscricao')
  })

  it('POST /payments/expenses creates an expense', async () => {
    const res = await request(app.getHttpServer()).post('/payments/expenses').send({
      category: 'arbitragem',
      amount: 5000,
      description: 'Arbitragem rodada 1',
    })
    expect(res.status).toBe(201)
  })

  it('POST /payments/expenses rejects unknown category', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments/expenses')
      .send({ category: 'cerveja', amount: 5000, description: 'x' })
    expect(res.status).toBe(400)
  })

  it('DELETE /payments/expenses/:id returns 204', async () => {
    const res = await request(app.getHttpServer()).delete(`/payments/expenses/${EXPENSE_ID}`)
    expect(res.status).toBe(204)
  })

  it('GET /payments/dashboard/:championshipId returns the P&L', async () => {
    const res = await request(app.getHttpServer()).get(`/payments/dashboard/${CHAMP_ID}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('netResult')
  })
})

describe('PaymentsController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(TORCEDOR)
  })

  afterAll(() => app.close())

  it.each([
    ['GET', '/payments'],
    ['GET', `/payments/ledger/${CHAMP_ID}`],
    ['GET', '/payments/expenses'],
    ['GET', `/payments/dashboard/${CHAMP_ID}`],
  ])('%s %s returns 403 for torcedor', async (method, url) => {
    const res = await request(app.getHttpServer())[method.toLowerCase() as 'get'](url)
    expect(res.status).toBe(403)
  })

  it('POST /payments/:id/refund returns 403 for torcedor', async () => {
    const res = await request(app.getHttpServer()).post(`/payments/${TX_ID}/refund`).send({})
    expect(res.status).toBe(403)
  })

  it('POST /payments (create order) is allowed for any authenticated user', async () => {
    const res = await request(app.getHttpServer()).post('/payments').send({
      amount: 10000,
      method: 'pix',
      category: 'inscricao',
      description: 'Taxa',
    })
    expect(res.status).toBe(201)
  })
})
