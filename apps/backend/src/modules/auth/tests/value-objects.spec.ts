import { describe, it, expect } from 'vitest'
import { Email } from '../domain/value-objects/email.vo'
import { Password } from '../domain/value-objects/password.vo'
import { ValidationError } from '../../../shared/errors'

describe('Email VO', () => {
  it('creates valid email and normalizes to lowercase', () => {
    const email = Email.create('User@Example.COM')
    expect(email.getValue()).toBe('user@example.com')
  })

  it('trims whitespace before validating', () => {
    const email = Email.create('  hello@world.io  ')
    expect(email.getValue()).toBe('hello@world.io')
  })

  it('throws ValidationError for missing @ symbol', () => {
    expect(() => Email.create('notanemail')).toThrow(ValidationError)
  })

  it('throws ValidationError for missing domain', () => {
    expect(() => Email.create('user@')).toThrow(ValidationError)
  })

  it('throws ValidationError for missing TLD', () => {
    expect(() => Email.create('user@domain')).toThrow(ValidationError)
  })

  it('throws ValidationError for empty string', () => {
    expect(() => Email.create('')).toThrow(ValidationError)
  })

  it('toString returns underlying value', () => {
    const email = Email.create('test@test.com')
    expect(email.toString()).toBe('test@test.com')
  })
})

describe('Password VO', () => {
  const VALID = 'StrongP@ss1'

  it('creates raw password for valid strong password', () => {
    const pw = Password.createRaw(VALID)
    expect(pw.raw).toBe(VALID)
    expect(pw.isHashed()).toBe(false)
  })

  it('throws if password is shorter than 8 characters', () => {
    expect(() => Password.createRaw('Ab1@x')).toThrow(ValidationError)
  })

  it('throws if password exceeds 128 characters', () => {
    expect(() => Password.createRaw('Ab1@' + 'x'.repeat(130))).toThrow(ValidationError)
  })

  it('throws if password has no uppercase letter', () => {
    expect(() => Password.createRaw('noupperc@se1')).toThrow(ValidationError)
  })

  it('throws if password has no lowercase letter', () => {
    expect(() => Password.createRaw('NOLOWER@1')).toThrow(ValidationError)
  })

  it('throws if password has no digit', () => {
    expect(() => Password.createRaw('NoDigit@here')).toThrow(ValidationError)
  })

  it('throws if password has no special character', () => {
    expect(() => Password.createRaw('NoSpecial1A')).toThrow(ValidationError)
  })

  it('throws for common passwords', () => {
    expect(() => Password.createRaw('password')).toThrow(ValidationError)
  })

  it('fromHash always succeeds and isHashed returns true', () => {
    const pw = Password.fromHash('$2b$10$somehash')
    expect(pw.isHashed()).toBe(true)
    expect(pw.raw).toBe('$2b$10$somehash')
  })
})
