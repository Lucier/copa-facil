import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schemas/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://cerradosesportes:cerradosesportes@localhost:5434/cerradosesportes',
  },
})
