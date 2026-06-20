import { describe, it, expect } from 'vitest'
import { GetHealthUseCase } from '../application/get-health.use-case'

describe('GetHealthUseCase', () => {
  const useCase = new GetHealthUseCase()

  it('should return ok status', () => {
    const result = useCase.execute()
    expect(result.status).toBe('ok')
  })

  it('should return a current timestamp', () => {
    const before = new Date()
    const result = useCase.execute()
    const after = new Date()
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('should return an empty services array', () => {
    const result = useCase.execute()
    expect(result.services).toEqual([])
  })
})
