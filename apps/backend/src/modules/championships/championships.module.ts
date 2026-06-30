import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { CHAMPIONSHIP_REPOSITORY } from './domain/repositories/i-championship.repository'
import { ROUND_REPOSITORY } from './domain/repositories/i-round.repository'
import { TEAM_REPOSITORY } from './domain/repositories/i-team.repository'
import { CreateChampionshipUseCase } from './application/use-cases/create-championship.use-case'
import { GenerateFixturesUseCase } from './application/use-cases/generate-fixtures.use-case'
import { GetBracketTreeUseCase } from './application/use-cases/get-bracket-tree.use-case'
import { ListChampionshipsUseCase } from './application/use-cases/list-championships.use-case'
import { DrizzleChampionshipRepository } from './infrastructure/repositories/drizzle-championship.repository'
import { DrizzleRoundRepository } from './infrastructure/repositories/drizzle-round.repository'
import { DrizzleTeamRepository } from './infrastructure/repositories/drizzle-team.repository'
import { ChampionshipController } from './presentation/controllers/championship.controller'
import { StructureController } from './presentation/controllers/structure.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: CHAMPIONSHIP_REPOSITORY, useClass: DrizzleChampionshipRepository },
    { provide: ROUND_REPOSITORY, useClass: DrizzleRoundRepository },
    { provide: TEAM_REPOSITORY, useClass: DrizzleTeamRepository },
    CreateChampionshipUseCase,
    GenerateFixturesUseCase,
    GetBracketTreeUseCase,
    ListChampionshipsUseCase,
  ],
  controllers: [ChampionshipController, StructureController],
})
export class ChampionshipsModule {}
