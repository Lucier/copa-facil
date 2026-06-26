import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths({ ignoreConfigErrors: true }),
    swc.vite({
      jsc: {
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.module.ts',
        'src/main.ts',
        'src/**/*.dto.ts',
        'src/**/*.interface.ts',
        'src/**/*.constants.ts',
        'src/**/index.ts',
        'src/config/**',
        'src/database/schemas/**',
        // Infrastructure (DB/Redis/Storage) — tested via integration tests
        'src/**/infrastructure/repositories/**',
        'src/**/infrastructure/services/**',
        'src/**/infrastructure/strategies/**',
        'src/infrastructure/**',
        'src/database/**',
        // Infrastructure (external APIs/adapters) — need real credentials/services
        'src/**/infrastructure/adapters/**',
        'src/**/infrastructure/interceptors/**',
        // Controllers — tested via integration/E2E tests
        'src/**/presentation/controllers/**',
        'src/**/presentation/webhooks/**',
        'src/modules/upload/**',
        // Jobs, websockets, events
        'src/jobs/**',
        'src/websockets/**',
        'src/events/**',
        // Mappers (pure data mapping, trivial to verify via use case output)
        'src/**/application/mappers/**',
        // Decorators
        'src/**/presentation/decorators/**',
        // Guards tested separately via unit tests
        'src/**/presentation/guards/jwt-auth.guard.ts',
        // Domain entities (plain data holders — tested implicitly via use cases)
        'src/**/domain/entities/**',
        'src/**/domain/value-objects/**',
        // Config and build artifacts
        'drizzle.config.ts',
        'vitest.config.mts',
        'dist/**',
      ],
      thresholds: {
        global: { branches: 80, functions: 80, lines: 80, statements: 80 },
      },
    },
  },
})
