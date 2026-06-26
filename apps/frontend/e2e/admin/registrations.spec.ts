import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import {
  mockApi,
  championshipsListResponse,
  registrationsListResponse,
  teamsListResponse,
  REG_ID_1,
  CHAMP_ID_1,
  TEAM_ID_1,
} from '../helpers/api-mock'

const TENANT = 'liga-paulista'

test.describe('Admin – Registrations', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    // Include /registrations so the page's auto-select + auto-fetch doesn't end up in error state
    await mockApi(page, {
      '/championships': { body: championshipsListResponse },
      '/teams': { body: teamsListResponse },
      '/registrations': { body: registrationsListResponse },
    })
    await page.goto(`/${TENANT}/admin/registrations`)
  })

  test('renders page title and submit button', async ({ page }) => {
    // Use locator('h1') to avoid strict-mode violation with the CardTitle h3
    await expect(page.locator('h1')).toContainText('Inscrições')
    await expect(page.getByRole('button', { name: /nova inscrição/i })).toBeVisible()
  })

  test('shows championship selector', async ({ page }) => {
    const select = page.locator('select').first()
    await expect(select).toBeVisible()
    // Check option text (includes season suffix)
    await expect(select.locator('option').first()).toContainText('Copa Regional 2026')
  })

  // Page auto-selects the first championship on load → registrations render immediately
  test('shows registrations table when a championship is selected', async ({ page }) => {
    await expect(page.getByText('Leões FC')).toBeVisible()
    await expect(page.getByText('Águias EC')).toBeVisible()
  })

  test('shows pending status badge', async ({ page }) => {
    await expect(page.getByText('Pendente')).toBeVisible()
    await expect(page.getByText('Aprovado')).toBeVisible()
  })

  test('shows review buttons for pending registrations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Aprovar' }).first()).toBeVisible()
  })

  test('opens review dialog on approve click', async ({ page }) => {
    await page.getByRole('button', { name: 'Aprovar' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText(/aprovar inscrição/i)).toBeVisible()
  })

  test('confirms approve and calls API', async ({ page }) => {
    await page.route(`**/${REG_ID_1}/approve`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...registrationsListResponse[0], status: 'aprovado' }),
      })
    })

    await page.getByRole('button', { name: 'Aprovar' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Confirm by clicking the "Aprovar" button inside the dialog footer
    await dialog.getByRole('button', { name: 'Aprovar' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin – Registrations – Submit Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    await mockApi(page, {
      '/championships': { body: championshipsListResponse },
      '/teams': { body: teamsListResponse },
      '/registrations': { body: [] },
    })
    await page.goto(`/${TENANT}/admin/registrations`)
  })

  test('opens submit registration dialog', async ({ page }) => {
    await page.getByRole('button', { name: /nova inscrição/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Nova Inscrição')).toBeVisible()
  })

  test('dialog has championship and team selectors', async ({ page }) => {
    await page.getByRole('button', { name: /nova inscrição/i }).click()
    const dialog = page.getByRole('dialog')
    // Use exact label text to avoid strict-mode with "Inscrever Time" button
    await expect(dialog.getByText('Campeonato *')).toBeVisible()
    await expect(dialog.getByText('Time *')).toBeVisible()
  })

  test('submits registration and closes dialog', async ({ page }) => {
    await page.route('**/registrations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'a9eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', championshipId: CHAMP_ID_1, teamId: TEAM_ID_1, status: 'pendente' }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
    })

    // Wait for the page to auto-select and sync defaultChampionshipId into the dialog form
    await expect(page.locator('select').first()).not.toHaveValue('')

    await page.getByRole('button', { name: /nova inscrição/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Championship is pre-filled and disabled (synced via useEffect in SubmitRegistrationDialog)
    // Select only the team
    const teamSelect = dialog.locator('select').nth(1)
    await expect(teamSelect.locator(`option[value="${TEAM_ID_1}"]`)).toBeAttached()
    await teamSelect.selectOption({ value: TEAM_ID_1 })

    await dialog.getByRole('button', { name: 'Inscrever Time' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})
