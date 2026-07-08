import { Inject, Injectable } from '@nestjs/common'
import type Redis from 'ioredis'
import { DrizzleService } from '../../../database/drizzle.service'
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants'
import { HealthCheck, HealthStatus, ServiceHealth } from '../domain/health.entity'

@Injectable()
export class GetHealthUseCase {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async execute(): Promise<HealthCheck> {
    const [postgres, redis] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
    ])

    const services: ServiceHealth[] = [postgres, redis]
    const hasDown = services.some((s) => s.status === 'down')
    const hasDegraded = services.some((s) => s.status === 'degraded')
    const overall: HealthStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'ok'

    return {
      status: overall,
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date(),
      services,
    }
  }

  private async checkPostgres(): Promise<ServiceHealth> {
    const start = Date.now()
    try {
      await this.drizzle.runRaw((sql) => sql`SELECT 1`)
      return { name: 'postgres', status: 'ok', latencyMs: Date.now() - start }
    } catch {
      return { name: 'postgres', status: 'down', latencyMs: Date.now() - start }
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now()
    try {
      const pong = await this.redis.ping()
      return {
        name: 'redis',
        status: pong === 'PONG' ? 'ok' : 'degraded',
        latencyMs: Date.now() - start,
      }
    } catch {
      return { name: 'redis', status: 'down', latencyMs: Date.now() - start }
    }
  }
}
