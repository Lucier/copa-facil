import { Module } from '@nestjs/common'
import { GetHealthUseCase } from './application/get-health.use-case'
import { HealthController } from './presentation/health.controller'

@Module({
  controllers: [HealthController],
  providers: [GetHealthUseCase],
})
export class HealthModule {}
