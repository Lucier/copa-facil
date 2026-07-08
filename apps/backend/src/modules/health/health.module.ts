import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { GetHealthUseCase } from './application/get-health.use-case'
import { HealthController } from './presentation/health.controller'

@Module({
  imports: [DrizzleModule],
  controllers: [HealthController],
  providers: [GetHealthUseCase],
})
export class HealthModule {}
