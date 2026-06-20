import { describe, it, expect, beforeAll } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { HealthController } from '../presentation/health.controller'
import { GetHealthUseCase } from '../application/get-health.use-case'

describe('HealthController (integration)', () => {
  let controller: HealthController

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [GetHealthUseCase],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should return health check with ok status', () => {
    const result = controller.check()
    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeInstanceOf(Date)
    expect(result.services).toBeInstanceOf(Array)
  })
})
