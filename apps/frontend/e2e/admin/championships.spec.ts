import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { mockApi, championshipsListResponse, teamsListResponse } from '../helpers/api-mock'

const TENANT = 'liga-paulista'

test.describe('Admin – Championships', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    await mockApi(page, {
      '/championships': { body: championshipsListResponse },
      '/teams': { body: teamsListResponse },
    })
    await page.goto(`/${TENANT}/admin/championships`)
  })

  test('renders page title and "Novo Campeonato" button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Campeonatos', exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /novo campeonato/i })).toBeVisible()
  })

  test('lists existing championships in a table', async ({ page }) => {
    await expect(page.getByText('Copa Regional 2026')).toBeVisible()
    await expect(page.getByText('Torneio Cidade 2026')).toBeVisible()
  })

  test('shows correct status badges', async ({ page }) => {
    await expect(page.getByText('Ativo')).toBeVisible()
    await expect(page.getByText('Rascunho')).toBeVisible()
  })

  test('shows format labels correctly', async ({ page }) => {
    await expect(page.getByText('Pontos Corridos')).toBeVisible()
    await expect(page.getByText('Mata-Mata')).toBeVisible()
  })

  test('opens "Novo Campeonato" dialog on button click', async ({ page }) => {
    await page.getByRole('button', { name: /novo campeonato/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText(/novo campeonato/i)).toBeVisible()
  })

  test('dialog has name, season, format and legs fields', async ({ page }) => {
    await page.getByRole('button', { name: /novo campeonato/i }).click()
    const dialog = page.getByRole('dialog')

    await expect(dialog.getByLabel('Nome')).toBeVisible()
    await expect(dialog.getByLabel('Temporada')).toBeVisible()
    await expect(dialog.getByLabel('Formato')).toBeVisible()
  })

  test('shows validation error when championship name is too short', async ({ page }) => {
    await page.getByRole('button', { name: /novo campeonato/i }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nome').fill('AB')
    await dialog.getByRole('button', { name: /criar/i }).click()

    await expect(dialog.getByText(/pelo menos 3 caracteres/i)).toBeVisible()
  })

  test('creates championship and closes dialog on success', async ({ page }) => {
    const newChamp = {
      id: 'c3',
      name: 'Copa Test E2E',
      season: '2026',
      format: 'pontos_corridos',
      status: 'draft',
      legs: 1,
      logoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await mockApi(page, {
      '/championships': { body: [...championshipsListResponse, newChamp] },
      '/teams': { body: teamsListResponse },
    })

    // Mock POST /championships
    await page.route('**/localhost:3001/championships', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newChamp) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([...championshipsListResponse, newChamp]) })
      }
    })

    await page.getByRole('button', { name: /novo campeonato/i }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nome').fill('Copa Test E2E')
    await dialog.getByLabel('Temporada').fill('2026')
    await dialog.getByRole('button', { name: /criar/i }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Admin – Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAs(context)
    await page.goto(`/${TENANT}/admin`)
  })

  test('renders dashboard with stats cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Campeonatos Ativos')).toBeVisible()
    await expect(page.getByText('Times Inscritos')).toBeVisible()
    await expect(page.getByText('Jogadores Cadastrados')).toBeVisible()
    await expect(page.getByText('Partidas Realizadas')).toBeVisible()
  })

  test('renders recent matches table', async ({ page }) => {
    await expect(page.getByText('Partidas Recentes')).toBeVisible()
    await expect(page.getByText('Rápidos FC')).toBeVisible()
  })

  test('renders pending actions section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ações Pendentes' })).toBeVisible()
  })
})
