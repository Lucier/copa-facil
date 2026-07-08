import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_SECURE: z.coerce.boolean().default(false),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production') {
    if (!env.MP_ACCESS_TOKEN) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MP_ACCESS_TOKEN'], message: 'Required in production' })
    }
    if (!env.MP_WEBHOOK_SECRET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MP_WEBHOOK_SECRET'], message: 'Required in production' })
    }
    if (!env.ENCRYPTION_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ENCRYPTION_KEY'], message: 'Required in production' })
    }
    if (!env.MAIL_HOST) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MAIL_HOST'], message: 'Required in production' })
    }
    if (!env.MAIL_USER) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MAIL_USER'], message: 'Required in production' })
    }
    if (!env.MAIL_PASS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MAIL_PASS'], message: 'Required in production' })
    }
  }
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${result.error.toString()}`)
  }
  return result.data
}
