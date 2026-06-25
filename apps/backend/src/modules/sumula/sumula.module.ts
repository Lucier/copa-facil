import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { MatchEngineModule } from '../match-engine/match-engine.module'
import { LINEUP_REPOSITORY } from './domain/repositories/i-lineup.repository'
import { OFFICIAL_REPOSITORY } from './domain/repositories/i-official.repository'
import { SUMULA_REPOSITORY } from './domain/repositories/i-sumula.repository'
import { OpenSumulaUseCase } from './application/use-cases/open-sumula.use-case'
import { GetSumulaUseCase } from './application/use-cases/get-sumula.use-case'
import { AddPlayerToLineupUseCase } from './application/use-cases/add-player-to-lineup.use-case'
import { RemovePlayerFromLineupUseCase } from './application/use-cases/remove-player-from-lineup.use-case'
import { AddOfficialUseCase } from './application/use-cases/add-official.use-case'
import { UpdateObservationsUseCase } from './application/use-cases/update-observations.use-case'
import { CloseSumulaUseCase } from './application/use-cases/close-sumula.use-case'
import { RemoveOfficialUseCase } from './application/use-cases/remove-official.use-case'
import { DrizzleLineupRepository } from './infrastructure/repositories/drizzle-lineup.repository'
import { DrizzleOfficialRepository } from './infrastructure/repositories/drizzle-official.repository'
import { DrizzleSumulaRepository } from './infrastructure/repositories/drizzle-sumula.repository'
import { SumulaController } from './presentation/controllers/sumula.controller'

@Module({
  imports: [DrizzleModule, AuthModule, MatchEngineModule],
  providers: [
    { provide: SUMULA_REPOSITORY, useClass: DrizzleSumulaRepository },
    { provide: LINEUP_REPOSITORY, useClass: DrizzleLineupRepository },
    { provide: OFFICIAL_REPOSITORY, useClass: DrizzleOfficialRepository },
    OpenSumulaUseCase,
    GetSumulaUseCase,
    AddPlayerToLineupUseCase,
    RemovePlayerFromLineupUseCase,
    AddOfficialUseCase,
    RemoveOfficialUseCase,
    UpdateObservationsUseCase,
    CloseSumulaUseCase,
  ],
  controllers: [SumulaController],
})
export class SumulaModule {}
