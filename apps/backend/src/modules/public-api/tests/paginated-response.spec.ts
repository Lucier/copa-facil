import { describe, it, expect } from 'vitest'
import { toPaginated } from '../application/dtos/paginated-response.dto'

describe('toPaginated', () => {
  it('returns correct meta for first page', () => {
    const result = toPaginated(['a', 'b'], { page: 1, limit: 20, total: 42 })
    expect(result.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 42,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    })
    expect(result.data).toEqual(['a', 'b'])
  })

  it('returns correct meta for last page', () => {
    const result = toPaginated([], { page: 3, limit: 20, total: 42 })
    expect(result.meta).toMatchObject({
      totalPages: 3,
      hasNext: false,
      hasPrev: true,
    })
  })

  it('returns correct meta for middle page', () => {
    const result = toPaginated([], { page: 2, limit: 20, total: 60 })
    expect(result.meta).toMatchObject({
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it('returns totalPages=0 and no next/prev when total is 0', () => {
    const result = toPaginated([], { page: 1, limit: 20, total: 0 })
    expect(result.meta).toMatchObject({
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('handles single-page result correctly', () => {
    const result = toPaginated(['x'], { page: 1, limit: 20, total: 1 })
    expect(result.meta).toMatchObject({
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('rounds up totalPages when total does not divide evenly', () => {
    const result = toPaginated([], { page: 1, limit: 10, total: 21 })
    expect(result.meta.totalPages).toBe(3)
  })

  it('preserves the data array as-is', () => {
    const data = [{ id: '1' }, { id: '2' }]
    const result = toPaginated(data, { page: 1, limit: 10, total: 2 })
    expect(result.data).toBe(data)
  })
})
