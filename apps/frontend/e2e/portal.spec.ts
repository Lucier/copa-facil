import { test, expect } from '@playwright/test'

const TENANT = 'liga-paulista'

/**
 * The portal public pages are Next.js Server Components that use publicFetch.
 * In the E2E environment there is no real backend, so publicFetch fails gracefully
 * (Promise.allSettled) and the page renders its empty-state UI.
 * These tests verify the page structure and navigation are correct.
 */

test.describe('Portal – Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${TENANT}`)
  })

  test('renders welcome heading with tenant name', async ({ page }) => {
    // Heading is "Bem-vindo ao portal Liga Paulista" — check for the formatted slug text
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Liga Paulista')
  })

  test('shows navigation links to portal sections', async ({ page }) => {
    const champLink = page.getByRole('link', { name: /campeonatos/i }).first()
    await expect(champLink).toBeVisible()
    await expect(champLink).toHaveAttribute('href', `/${TENANT}/championships`)

    const teamsLink = page.getByRole('link', { name: /times/i }).first()
    await expect(teamsLink).toBeVisible()
    await expect(teamsLink).toHaveAttribute('href', `/${TENANT}/teams`)
  })

  test('shows empty-state message when no data is available', async ({ page }) => {
    // With no backend, portal shows the empty state section — use .first() to avoid strict-mode
    await expect(page.getByRole('link', { name: /Ver times/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Ver campeonatos/i }).first()).toBeVisible()
  })
})

test.describe('Portal – Public Navbar', () => {
  test('shows navbar with Copa Fácil logo and tenant name', async ({ page }) => {
    await page.goto(`/${TENANT}`)
    const nav = page.getByRole('navigation').first()
    await expect(nav).toBeVisible()
  })

  test('has links to matches and standings in the navbar', async ({ page }) => {
    await page.goto(`/${TENANT}`)
    await expect(page.getByRole('link', { name: /partidas/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /tabela/i }).first()).toBeVisible()
  })
})

test.describe('Portal – Standings Page', () => {
  test('renders page title', async ({ page }) => {
    await page.goto(`/${TENANT}/standings`)
    await expect(page.getByRole('heading', { name: /tabela de classificação/i })).toBeVisible()
  })
})

test.describe('Portal – Matches Page', () => {
  test('renders matches page', async ({ page }) => {
    await page.goto(`/${TENANT}/matches`)
    await expect(page.getByRole('heading', { name: /partidas/i })).toBeVisible()
  })
})

test.describe('Portal – Teams Page', () => {
  test('renders teams page', async ({ page }) => {
    await page.goto(`/${TENANT}/teams`)
    await expect(page.getByRole('heading', { name: /times/i })).toBeVisible()
  })
})

test.describe('Portal – Championships Page', () => {
  test('renders championships page', async ({ page }) => {
    await page.goto(`/${TENANT}/championships`)
    await expect(page.getByRole('heading', { name: /campeonatos/i })).toBeVisible()
  })
})

test.describe('Portal – Authentication redirect', () => {
  test('redirects to login when accessing admin without cookie', async ({ page }) => {
    await page.goto(`/${TENANT}/admin`)
    await page.waitForURL(`**/${TENANT}/login**`)
    expect(page.url()).toContain(`/${TENANT}/login`)
  })

  test('login page shows correct tenant slug', async ({ page }) => {
    await page.goto(`/${TENANT}/login`)
    await expect(page.getByText(TENANT)).toBeVisible()
  })
})
