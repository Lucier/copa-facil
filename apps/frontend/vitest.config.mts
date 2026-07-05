import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    // Playwright specs live in e2e/ and run via `pnpm test:e2e`
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/store/**', 'src/hooks/**', 'src/services/**'],
      exclude: ['src/**/*.spec.*', 'src/services/endpoints.ts'],
    },
  },
})
