import { describe, expect, it } from 'vitest'
import {
  concludeMatchSchema,
  createChampionshipSchema,
  createPaymentSchema,
  createTeamSchema,
  loginSchema,
  registerStep1Schema,
  registerStep2Schema,
  submitRegistrationSchema,
} from './zod-schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(true)
  })

  it('rejects invalid email and short password', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: '12345' })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toContain('email')
    expect(paths).toContain('password')
  })
})

describe('registerStep1Schema', () => {
  const valid = {
    name: 'Lucier',
    email: 'Lucier@Test.com',
    password: 'Senha@123',
    confirmPassword: 'Senha@123',
  }

  it('accepts a strong password and lowercases the email', () => {
    const result = registerStep1Schema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('lucier@test.com')
  })

  it.each([
    ['sem maiúscula', 'senha@123'],
    ['sem minúscula', 'SENHA@123'],
    ['sem número', 'Senha@abc'],
    ['sem especial', 'Senha1234'],
    ['curta', 'Se@1'],
  ])('rejects weak password (%s)', (_label, password) => {
    const result = registerStep1Schema.safeParse({ ...valid, password, confirmPassword: password })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched confirmation on confirmPassword path', () => {
    const result = registerStep1Schema.safeParse({ ...valid, confirmPassword: 'Outra@123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })
})

describe('registerStep2Schema', () => {
  it('accepts a valid slug and plan', () => {
    const result = registerStep2Schema.safeParse({
      organizationName: 'Liga Paulista',
      organizationSlug: 'liga-paulista-2026',
      plan: 'starter',
    })
    expect(result.success).toBe(true)
  })

  it.each(['Liga', 'liga_paulista', '-liga', 'liga-', 'liga paulista'])(
    'rejects invalid slug %s',
    (slug) => {
      const result = registerStep2Schema.safeParse({
        organizationName: 'Liga',
        organizationSlug: slug,
        plan: 'liga',
      })
      expect(result.success).toBe(false)
    },
  )
})

describe('createTeamSchema', () => {
  it('transforms empty optional strings to undefined', () => {
    const result = createTeamSchema.parse({ name: 'Time A', acronym: '', city: '', primaryColor: '' })
    expect(result.acronym).toBeUndefined()
    expect(result.city).toBeUndefined()
    expect(result.primaryColor).toBeUndefined()
  })

  it('validates hex colors', () => {
    expect(createTeamSchema.safeParse({ name: 'Time A', primaryColor: '#FF0000' }).success).toBe(true)
    expect(createTeamSchema.safeParse({ name: 'Time A', primaryColor: 'vermelho' }).success).toBe(false)
  })

  it('limits acronym to 4 chars', () => {
    expect(createTeamSchema.safeParse({ name: 'Time A', acronym: 'ABCDE' }).success).toBe(false)
  })
})

describe('createChampionshipSchema', () => {
  it('accepts valid input', () => {
    expect(
      createChampionshipSchema.safeParse({
        name: 'Copa Verão',
        season: '2026',
        format: 'pontos_corridos',
        legs: 2,
      }).success,
    ).toBe(true)
  })

  it('rejects legs above 2 and unknown format', () => {
    expect(
      createChampionshipSchema.safeParse({ name: 'Copa', season: '2026', format: 'pontos_corridos', legs: 3 })
        .success,
    ).toBe(false)
    expect(
      createChampionshipSchema.safeParse({ name: 'Copa', season: '2026', format: 'suico', legs: 1 }).success,
    ).toBe(false)
  })
})

describe('createPaymentSchema', () => {
  it('requires positive amount and valid method', () => {
    const base = { method: 'pix', category: 'inscricao', description: 'Taxa' }
    expect(createPaymentSchema.safeParse({ ...base, amountBrl: 100 }).success).toBe(true)
    expect(createPaymentSchema.safeParse({ ...base, amountBrl: 0 }).success).toBe(false)
    expect(createPaymentSchema.safeParse({ ...base, amountBrl: 100, method: 'dinheiro' }).success).toBe(false)
  })

  it('limits installments to 12', () => {
    const base = { method: 'cartao_credito', category: 'inscricao', description: 'Taxa', amountBrl: 100 }
    expect(createPaymentSchema.safeParse({ ...base, installments: 12 }).success).toBe(true)
    expect(createPaymentSchema.safeParse({ ...base, installments: 13 }).success).toBe(false)
  })
})

describe('submitRegistrationSchema', () => {
  it('requires UUIDs', () => {
    expect(
      submitRegistrationSchema.safeParse({
        championshipId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
        teamId: 'c56a4180-65aa-42ec-a945-5fd21dec0539',
      }).success,
    ).toBe(true)
    expect(submitRegistrationSchema.safeParse({ championshipId: '1', teamId: '2' }).success).toBe(false)
  })
})

describe('concludeMatchSchema', () => {
  it('rejects negative scores', () => {
    expect(concludeMatchSchema.safeParse({ homeScore: 2, awayScore: 0 }).success).toBe(true)
    expect(concludeMatchSchema.safeParse({ homeScore: -1, awayScore: 0 }).success).toBe(false)
  })
})
