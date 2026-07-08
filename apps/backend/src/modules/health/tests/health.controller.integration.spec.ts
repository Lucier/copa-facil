import { describe, it, expect, beforeAll, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants'
import { GetHealthUseCase } from '../application/get-health.use-case'
import { HealthController } from '../presentation/health.controller'

const mockDrizzle = { runRaw: vi.fn().mockResolvedValue(undefined) }
const mockRedis = { ping: vi.fn().mockResolvedValue('PONG') }

describe('HealthController (integration)', () => {
  let controller: HealthController

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        GetHealthUseCase,
        { provide: 'DrizzleService', useValue: mockDrizzle },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    })
      .overrideProvider(GetHealthUseCase)
      .useValue({ execute: vi.fn().mockResolvedValue({ status: 'ok', version: '0.0.1', timestamp: new Date(), services: [] }) })
      .compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should return health check with ok status', async () => {
    const result = await controller.check()
    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeInstanceOf(Date)
    expect(result.services).toBeInstanceOf(Array)
  })
})
