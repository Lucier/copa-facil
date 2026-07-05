import { describe, expect, it } from 'vitest'
import { cn, formatCurrency, formatDate, formatDateTime, getInitials } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves tailwind conflicts keeping the last class', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null)).toBe('a')
  })
})

describe('formatCurrency', () => {
  it('formats cents as BRL', () => {
    expect(formatCurrency(150050).replace(/ /g, ' ')).toBe('R$ 1.500,50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0).replace(/ /g, ' ')).toBe('R$ 0,00')
  })
})

describe('formatDate', () => {
  it('formats ISO string as dd/mm/yyyy', () => {
    expect(formatDate('2026-07-04T12:00:00Z')).toMatch(/^0?4\/07\/2026$/)
  })

  it('accepts Date objects', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15/01/2026')
  })
})

describe('formatDateTime', () => {
  it('includes hours and minutes', () => {
    const result = formatDateTime(new Date(2026, 0, 15, 18, 30))
    expect(result).toContain('15/01/2026')
    expect(result).toContain('18:30')
  })
})

describe('getInitials', () => {
  it('returns first two initials uppercased', () => {
    expect(getInitials('lucier lima')).toBe('LL')
  })

  it('limits to two initials for long names', () => {
    expect(getInitials('Ana Beatriz Costa Dias')).toBe('AB')
  })

  it('handles single name', () => {
    expect(getInitials('Pelé')).toBe('P')
  })
})
