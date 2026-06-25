import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { MATCH_EVENT_REPOSITORY } from './domain/repositories/i-match-event.repository'
import { MATCH_REPOSITORY } from './domain/repositories/i-match.repository'
import { STANDING_REPOSITORY } from './domain/repositories/i-standing.repository'
import { STATISTIC_REPOSITORY } from './domain/repositories/i-statistic.repository'
import { HandleFairPlayHandler } from './application/handlers/handle-fair-play.handler'
import { UpdatePlayerStatsHandler } from './application/handlers/update-player-stats.handler'
import { UpdateStandingsHandler } from './application/handlers/update-standings.handler'
import { ConcludeMatchUseCase } from './application/use-cases/conclude-match.use-case'
import { GetMatchEventsUseCase } from './application/use-cases/get-match-events.use-case'
import { GetStandingsUseCase } from './application/use-cases/get-standings.use-case'
import { GetTopScorersUseCase } from './application/use-cases/get-top-scorers.use-case'
import { GetChampionshipReportUseCase } from './application/use-cases/get-championship-report.use-case'
import {
  CreateCustomRankingUseCase,
  ListCustomRankingsUseCase,
  DeleteCustomRankingUseCase,
  ComputeCustomRankingUseCase,
} from './application/use-cases/custom-rankings.use-case'
import { RegisterMatchEventUseCase } from './application/use-cases/register-match-event.use-case'
import { StartMatchUseCase } from './application/use-cases/start-match.use-case'
import { ListMatchesForAdminUseCase } from './application/use-cases/list-matches-for-admin.use-case'
import { DrizzleMatchEventRepository } from './infrastructure/repositories/drizzle-match-event.repository'
import { DrizzleMatchRepository } from './infrastructure/repositories/drizzle-match.repository'
import { DrizzleStandingRepository } from './infrastructure/repositories/drizzle-standing.repository'
import { DrizzleStatisticRepository } from './infrastructure/repositories/drizzle-statistic.repository'
import { ChampionshipMatchesController } from './presentation/controllers/championship-matches.controller'
import { MatchEventsController } from './presentation/controllers/match-events.controller'
import { MatchesController } from './presentation/controllers/matches.controller'
import { StandingsController } from './presentation/controllers/standings.controller'
import { StatisticsController } from './presentation/controllers/statistics.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: MATCH_REPOSITORY, useClass: DrizzleMatchRepository },
    { provide: MATCH_EVENT_REPOSITORY, useClass: DrizzleMatchEventRepository },
    { provide: STANDING_REPOSITORY, useClass: DrizzleStandingRepository },
    { provide: STATISTIC_REPOSITORY, useClass: DrizzleStatisticRepository },
    StartMatchUseCase,
    ListMatchesForAdminUseCase,
    RegisterMatchEventUseCase,
    ConcludeMatchUseCase,
    GetMatchEventsUseCase,
    GetStandingsUseCase,
    GetTopScorersUseCase,
    GetChampionshipReportUseCase,
    CreateCustomRankingUseCase,
    ListCustomRankingsUseCase,
    DeleteCustomRankingUseCase,
    ComputeCustomRankingUseCase,
    UpdateStandingsHandler,
    UpdatePlayerStatsHandler,
    HandleFairPlayHandler,
  ],
  controllers: [ChampionshipMatchesController, MatchesController, MatchEventsController, StandingsController, StatisticsController],
  exports: [MATCH_REPOSITORY, MATCH_EVENT_REPOSITORY],
})
export class MatchEngineModule {}
