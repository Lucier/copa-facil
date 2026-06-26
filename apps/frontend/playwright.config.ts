import { defineConfig, devices } from '@playwright/test'

const PORT = 3000

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      JWT_SECRET: 'dev-secret-change-me-in-production-32c',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      // Portal pages need this to avoid throwing; we provide a dummy key so the
      // server-side fetch runs (but the actual backend won't be up in E2E tests,
      // so publicFetch will fail gracefully via Promise.allSettled)
      PORTAL_API_KEY_LIGA_PAULISTA: 'e2e-dummy-key',
    },
  },
})
