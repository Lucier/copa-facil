import { Injectable } from '@nestjs/common'
import type { HealthCheck } from '../domain/health.entity'

@Injectable()
export class GetHealthUseCase {
  execute(): HealthCheck {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date(),
      services: [],
    }
  }
}
