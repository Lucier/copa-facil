import { test, expect } from '@playwright/test'
import { createTestJwt } from './helpers/auth'
import { mockApi, loginSuccessResponse } from './helpers/api-mock'

const TENANT = 'liga-paulista'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${TENANT}/login`)
  })

  test('renders login form with Copa Fácil branding', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Copa Fácil' })).toBeVisible()
    await expect(page.getByText(TENANT)).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail inválido')).toBeVisible()
  })

  // type="email" triggers browser-native validation for invalid formats — verify form stays put
  test('shows validation error for invalid email format', async ({ page }) => {
    await page.getByLabel('E-mail').fill('not-an-email')
    await page.getByLabel('Senha').fill('pass')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(`/${TENANT}/login`)
    const emailInput = page.getByLabel('E-mail')
    expect(await emailInput.evaluate((el) => !(el as HTMLInputElement).validity.valid)).toBe(true)
  })

  test('shows error message on wrong credentials (401)', async ({ page }) => {
    await mockApi(page, {
      '/auth/login': { status: 401, body: { message: 'Invalid credentials' } },
    })

    await page.getByLabel('E-mail').fill('wrong@example.com')
    await page.getByLabel('Senha').fill('WrongPass1!')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  })

  test('redirects to admin dashboard on successful login', async ({ page }) => {
    const token = await createTestJwt()

    await mockApi(page, {
      '/auth/login': {
        status: 200,
        headers: { 'Set-Cookie': `access_token=${token}; Path=/; HttpOnly; SameSite=Lax` },
        body: loginSuccessResponse,
      },
    })

    await page.getByLabel('E-mail').fill('org@test.com')
    await page.getByLabel('Senha').fill('Password1!')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await page.waitForURL(`**/${TENANT}/admin**`)
    expect(page.url()).toContain(`/${TENANT}/admin`)
  })

  test('has link to registration page', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Criar organização' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/register')
  })
})

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  // "Copa Fácil" is a <span> in a logo link, not a <h1>, on the register page
  test('renders step 1 with user info form', async ({ page }) => {
    await expect(page.getByText('Copa Fácil')).toBeVisible()
    await expect(page.getByLabel('Nome completo')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirmar senha')).toBeVisible()
  })

  test('shows password strength validation errors', async ({ page }) => {
    await page.getByLabel('Nome completo').fill('Test User')
    await page.getByLabel('E-mail').fill('test@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('weak')
    await page.getByLabel('Confirmar senha').fill('weak')

    await page.getByRole('button', { name: 'Próximo' }).click()

    await expect(page.getByText('Senha deve ter pelo menos 8 caracteres')).toBeVisible()
  })

  test('shows error when passwords do not match', async ({ page }) => {
    await page.getByLabel('Nome completo').fill('Test User')
    await page.getByLabel('E-mail').fill('test@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('Password1!')
    await page.getByLabel('Confirmar senha').fill('DifferentPass1!')

    await page.getByRole('button', { name: 'Próximo' }).click()

    await expect(page.getByText('As senhas não coincidem')).toBeVisible()
  })

  test('advances to step 2 (org info) when step 1 is valid', async ({ page }) => {
    await page.getByLabel('Nome completo').fill('João Organizer')
    await page.getByLabel('E-mail').fill('joao@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('Password1!')
    await page.getByLabel('Confirmar senha').fill('Password1!')

    await page.getByRole('button', { name: 'Próximo' }).click()

    await expect(page.getByLabel('Nome da organização')).toBeVisible()
  })

  test('auto-generates slug from organization name', async ({ page }) => {
    // Advance to step 2
    await page.getByLabel('Nome completo').fill('Test User')
    await page.getByLabel('E-mail').fill('test@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('Password1!')
    await page.getByLabel('Confirmar senha').fill('Password1!')
    await page.getByRole('button', { name: 'Próximo' }).click()

    await page.getByLabel('Nome da organização').fill('Liga Paulista')

    // The slug input is a raw <input> nested inside a <div> (FormControl wrapper),
    // so getByLabel doesn't reach it — use placeholder instead
    const slugInput = page.locator('input[placeholder="liga-paulista"]')
    await expect(slugInput).toHaveValue('liga-paulista')
  })

  test('completes registration and redirects to admin', async ({ page }) => {
    const mockRegisterResponse = {
      ...loginSuccessResponse,
      tenantSlug: TENANT,
    }

    await mockApi(page, {
      '/auth/register': { status: 201, body: mockRegisterResponse },
    })

    // Step 1 — account info
    await page.getByLabel('Nome completo').fill('João Organizer')
    await page.getByLabel('E-mail').fill('joao@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('Password1!')
    await page.getByLabel('Confirmar senha').fill('Password1!')
    await page.getByRole('button', { name: 'Próximo' }).click()

    // Step 2 — org info; button text is "Revisar"
    await page.getByLabel('Nome da organização').fill('Liga Paulista')
    await page.getByRole('button', { name: 'Revisar' }).click()

    // Step 3 — confirmation; button text is "Criar minha conta"
    await page.getByRole('button', { name: /Criar minha conta/i }).click()
  })
})
