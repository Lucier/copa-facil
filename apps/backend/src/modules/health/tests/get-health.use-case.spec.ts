import { describe, it, expect, vi } from 'vitest'
import { GetHealthUseCase } from '../application/get-health.use-case'

const mockDrizzle = {
  runRaw: vi.fn().mockResolvedValue(undefined),
}

const mockRedis = {
  ping: vi.fn().mockResolvedValue('PONG'),
}

describe('GetHealthUseCase', () => {
  const useCase = new GetHealthUseCase(mockDrizzle as any, mockRedis as any)

  it('should return ok when postgres and redis are healthy', async () => {
    const result = await useCase.execute()
    expect(result.status).toBe('ok')
    expect(result.services).toHaveLength(2)
    expect(result.services.find((s) => s.name === 'postgres')?.status).toBe('ok')
    expect(result.services.find((s) => s.name === 'redis')?.status).toBe('ok')
  })

  it('should return down when postgres fails', async () => {
    mockDrizzle.runRaw.mockRejectedValueOnce(new Error('connection refused'))
    const result = await useCase.execute()
    expect(result.status).toBe('down')
    expect(result.services.find((s) => s.name === 'postgres')?.status).toBe('down')
  })

  it('should return down when redis fails', async () => {
    mockRedis.ping.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await useCase.execute()
    expect(result.status).toBe('down')
    expect(result.services.find((s) => s.name === 'redis')?.status).toBe('down')
  })

  it('should return a current timestamp', async () => {
    const before = new Date()
    const result = await useCase.execute()
    const after = new Date()
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
