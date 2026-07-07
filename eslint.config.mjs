import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      // TypeScript already reports undefined identifiers; no-undef false-positives on TS types
      'no-undef': 'off',
    },
  },
  {
    // NestJS DI resolves injected classes via decorator metadata; type-only
    // imports are erased at compile time and break dependency resolution
    files: ['apps/backend/**'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/tests/**', '**/e2e/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // specs intentionally test falsy operands and Intl narrow no-break spaces
      'no-constant-binary-expression': 'off',
      'no-irregular-whitespace': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**', '**/coverage/**'],
  },
]
