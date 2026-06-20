import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { DrizzleApiKeyRepository, API_KEY_REPOSITORY } from './infrastructure/repositories/drizzle-api-key.repository'
import { ApiKeyGuard } from './infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from './infrastructure/interceptors/public-audit.interceptor'
import { PublicChampionshipsController } from './presentation/controllers/public-championships.controller'
import { PublicTeamsController } from './presentation/controllers/public-teams.controller'
import { PublicPlayersController } from './presentation/controllers/public-players.controller'
import { PublicMatchesController } from './presentation/controllers/public-matches.controller'
import { PublicStandingsController } from './presentation/controllers/public-standings.controller'
import { PublicStatisticsController } from './presentation/controllers/public-statistics.controller'

@Module({
  imports: [DrizzleModule],
  controllers: [
    PublicChampionshipsController,
    PublicTeamsController,
    PublicPlayersController,
    PublicMatchesController,
    PublicStandingsController,
    PublicStatisticsController,
  ],
  providers: [
    { provide: API_KEY_REPOSITORY, useClass: DrizzleApiKeyRepository },
    ApiKeyGuard,
    PublicAuditInterceptor,
  ],
})
export class PublicApiModule {}
