import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { mockApi, TEAM_ID_1, TEAM_ID_2 } from '../helpers/api-mock'

const TENANT = 'liga-paulista'

const teams = [
  {
    id: TEAM_ID_1,
    name: 'Leões FC',
    acronym: 'LFC',
    city: 'São Paulo',
    nickname: 'Reis da Selva',
    logoUrl: null,
    primaryColor: '#FF0000',
    secondaryColor: '#FFFFFF',
    inviteToken: 'tok-leoes',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: TEAM_ID_2,
    name: 'Águias EC',
    acronym: 'AEC',
    city: 'Campinas',
    nickname: null,
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
    inviteToken: 'tok-aguias',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

test.describe('Admin – Teams', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    await mockApi(page, { '/teams': { body: teams } })
    await page.goto(`/${TENANT}/admin/teams`)
  })

  test('renders page title and create button', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Times')
    await expect(page.getByRole('button', { name: /cadastrar time/i })).toBeVisible()
  })

  test('shows stats cards with team counts', async ({ page }) => {
    await expect(page.getByText('Times Cadastrados')).toBeVisible()
    await expect(page.getByText('Com Cores Definidas')).toBeVisible()
  })

  test('lists teams in the table with colors and acronyms', async ({ page }) => {
    await expect(page.getByText('Leões FC')).toBeVisible()
    await expect(page.getByText('Águias EC')).toBeVisible()
    await expect(page.getByText('LFC')).toBeVisible()
    await expect(page.getByText('#FF0000')).toBeVisible()
  })

  test('opens create team dialog', async ({ page }) => {
    await page.getByRole('button', { name: /cadastrar time/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('opens edit dialog pre-filled with team data', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input:visible').first()).toHaveValue('Leões FC')
  })

  test('delete flow opens confirmation and calls API', async ({ page }) => {
    await page.route(`**/teams/${TEAM_ID_1}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, body: '' })
        return
      }
      await route.fallback()
    })

    await page.getByRole('row', { name: /Leões FC/ }).getByRole('button').last().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Excluir time?')).toBeVisible()
    await dialog.getByRole('button', { name: 'Excluir' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('shows empty state when no teams exist', async ({ page }) => {
    await mockApi(page, { '/teams': { body: [] } })
    await page.goto(`/${TENANT}/admin/teams`)
    await expect(page.getByText('Nenhum time cadastrado ainda.')).toBeVisible()
  })
})
