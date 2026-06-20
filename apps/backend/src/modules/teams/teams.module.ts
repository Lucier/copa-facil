import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { PLAYER_REPOSITORY } from './domain/repositories/i-player.repository'
import { STAFF_REPOSITORY } from './domain/repositories/i-staff.repository'
import { TEAM_REPOSITORY } from './domain/repositories/i-team.repository'
import { AssignStaffUseCase } from './application/use-cases/assign-staff.use-case'
import { CreateTeamUseCase } from './application/use-cases/create-team.use-case'
import { DeletePlayerUseCase } from './application/use-cases/delete-player.use-case'
import { DeleteTeamUseCase } from './application/use-cases/delete-team.use-case'
import { GetPlayerHistoryUseCase } from './application/use-cases/get-player-history.use-case'
import { GetPlayerUseCase } from './application/use-cases/get-player.use-case'
import { GetTeamUseCase } from './application/use-cases/get-team.use-case'
import { ListPlayersUseCase } from './application/use-cases/list-players.use-case'
import { ListStaffUseCase } from './application/use-cases/list-staff.use-case'
import { ListTeamsUseCase } from './application/use-cases/list-teams.use-case'
import { RegisterPlayerUseCase } from './application/use-cases/register-player.use-case'
import { RemoveStaffUseCase } from './application/use-cases/remove-staff.use-case'
import { TransferPlayerUseCase } from './application/use-cases/transfer-player.use-case'
import { UpdatePlayerUseCase } from './application/use-cases/update-player.use-case'
import { UpdateStaffUseCase } from './application/use-cases/update-staff.use-case'
import { UpdateTeamUseCase } from './application/use-cases/update-team.use-case'
import { DrizzlePlayerRepository } from './infrastructure/repositories/drizzle-player.repository'
import { DrizzleStaffRepository } from './infrastructure/repositories/drizzle-staff.repository'
import { DrizzleTeamRepository } from './infrastructure/repositories/drizzle-team.repository'
import { PlayersController } from './presentation/controllers/players.controller'
import { StaffController } from './presentation/controllers/staff.controller'
import { TeamsController } from './presentation/controllers/teams.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: TEAM_REPOSITORY, useClass: DrizzleTeamRepository },
    { provide: PLAYER_REPOSITORY, useClass: DrizzlePlayerRepository },
    { provide: STAFF_REPOSITORY, useClass: DrizzleStaffRepository },
    CreateTeamUseCase,
    ListTeamsUseCase,
    GetTeamUseCase,
    UpdateTeamUseCase,
    DeleteTeamUseCase,
    RegisterPlayerUseCase,
    ListPlayersUseCase,
    GetPlayerUseCase,
    UpdatePlayerUseCase,
    DeletePlayerUseCase,
    TransferPlayerUseCase,
    GetPlayerHistoryUseCase,
    AssignStaffUseCase,
    ListStaffUseCase,
    UpdateStaffUseCase,
    RemoveStaffUseCase,
  ],
  controllers: [TeamsController, PlayersController, StaffController],
})
export class TeamsModule {}
