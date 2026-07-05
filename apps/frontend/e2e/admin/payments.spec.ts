import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { mockApi, championshipsListResponse, CHAMP_ID_1 } from '../helpers/api-mock'

const TENANT = 'liga-paulista'
const TX_ID = 'a9eebc99-9c0b-4ef8-bb6d-6bb9bd380a99'

const transactions = [
  {
    id: TX_ID,
    championshipId: CHAMP_ID_1,
    referenceId: null,
    referenceType: null,
    amount: 15000,
    currency: 'BRL',
    method: 'pix',
    category: 'inscricao',
    status: 'paid',
    gatewayTransactionId: 'gw-123',
    payerId: null,
    paidAt: '2026-06-01T12:00:00Z',
    expiresAt: null,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T12:00:00Z',
    description: 'Inscrição Leões FC',
  },
  {
    id: 'b8eebc99-9c0b-4ef8-bb6d-6bb9bd380b88',
    championshipId: CHAMP_ID_1,
    referenceId: null,
    referenceType: null,
    amount: 5000,
    currency: 'BRL',
    method: 'boleto',
    category: 'patrocinio',
    status: 'pending',
    gatewayTransactionId: null,
    payerId: null,
    paidAt: null,
    expiresAt: null,
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z',
    description: 'Patrocínio local',
  },
]

const ledger = [{ category: 'inscricao', count: 1, total: 15000 }]

const expenses = [
  {
    id: 'c7eebc99-9c0b-4ef8-bb6d-6bb9bd380c77',
    championshipId: CHAMP_ID_1,
    category: 'arbitragem',
    amount: 8000,
    description: 'Arbitragem rodada 1',
    notes: null,
    expenseDate: '2026-06-03',
    createdAt: '2026-06-03T10:00:00Z',
  },
]

const dashboard = {
  income: [{ category: 'inscricao', total: 15000, count: 1 }],
  expenses: [{ category: 'arbitragem', total: 8000, count: 1 }],
  totalIncome: 15000,
  totalExpenses: 8000,
  netResult: 7000,
}

// Order matters: mockApi matches by substring, so specific routes come first
const routes = {
  '/payments/ledger': { body: ledger },
  '/payments/dashboard': { body: dashboard },
  '/payments/expenses': { body: expenses },
  '/payments': { body: transactions },
  '/championships': { body: championshipsListResponse },
}

test.describe('Admin – Payments', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    await mockApi(page, routes)
    await page.goto(`/${TENANT}/admin/payments`)
  })

  test('renders page title and action buttons', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Pagamentos')
    await expect(page.getByRole('button', { name: /nova cobrança/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /lançar despesa/i })).toBeVisible()
  })

  test('shows transactions table with status badges', async ({ page }) => {
    await expect(page.getByText('Inscrição Leões FC')).toBeVisible()
    await expect(page.getByText('Patrocínio local')).toBeVisible()
    await expect(page.getByText('Pago', { exact: true })).toBeVisible()
    await expect(page.getByText('Pendente', { exact: true })).toBeVisible()
  })

  test('shows summary stats cards', async ({ page }) => {
    await expect(page.getByText('Total Arrecadado')).toBeVisible()
    await expect(page.getByText('Pagamentos Confirmados')).toBeVisible()
    await expect(page.getByText('Aguardando Pagamento')).toBeVisible()
  })

  test('championship filter shows options', async ({ page }) => {
    const select = page.locator('select').first()
    await expect(select).toBeVisible()
    await expect(select.locator('option').first()).toContainText('Todos os Campeonatos')
    await expect(select.locator('option').nth(1)).toContainText('Copa Regional 2026')
  })

  test('selecting a championship loads ledger summary', async ({ page }) => {
    await page.locator('select').first().selectOption(CHAMP_ID_1)
    await expect(page.getByText('1 transação(ões)')).toBeVisible()
  })

  test('opens create payment dialog', async ({ page }) => {
    await page.getByRole('button', { name: /nova cobrança/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('opens add expense dialog and validates required fields', async ({ page }) => {
    await page.getByRole('button', { name: /lançar despesa/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Lançar Despesa' })).toBeVisible()
  })

  test('shows empty state when there are no transactions', async ({ page }) => {
    await mockApi(page, { ...routes, '/payments': { body: [] } })
    await page.goto(`/${TENANT}/admin/payments`)
    await expect(page.getByText('Nenhuma transação encontrada.')).toBeVisible()
  })
})
