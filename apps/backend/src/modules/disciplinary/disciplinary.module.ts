import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { MatchEngineModule } from '../match-engine/match-engine.module'
import { SUSPENSION_REPOSITORY } from './domain/repositories/i-suspension.repository'
import { CreateSuspensionUseCase } from './application/use-cases/create-suspension.use-case'
import { ListSuspensionsUseCase } from './application/use-cases/list-suspensions.use-case'
import { ServeSuspensionUseCase } from './application/use-cases/serve-suspension.use-case'
import { CancelSuspensionUseCase } from './application/use-cases/cancel-suspension.use-case'
import { AutoSuspensionHandler } from './application/handlers/auto-suspension.handler'
import { DrizzleSuspensionRepository } from './infrastructure/repositories/drizzle-suspension.repository'
import { DisciplinaryController } from './presentation/controllers/disciplinary.controller'

@Module({
  imports: [DrizzleModule, AuthModule, MatchEngineModule],
  providers: [
    { provide: SUSPENSION_REPOSITORY, useClass: DrizzleSuspensionRepository },
    CreateSuspensionUseCase,
    ListSuspensionsUseCase,
    ServeSuspensionUseCase,
    CancelSuspensionUseCase,
    AutoSuspensionHandler,
  ],
  controllers: [DisciplinaryController],
})
export class DisciplinaryModule {}
