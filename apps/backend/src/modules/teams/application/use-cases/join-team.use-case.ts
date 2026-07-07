import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { TeamEntity } from '../../domain/entities/team.entity'
import { IPlayerRepository} from '../../domain/repositories/i-player.repository'
import { PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'
import { ITeamRepository} from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { RegisterPlayerDto } from '../dtos/register-player.dto'

export interface JoinTeamResult {
  team: TeamEntity
  player: PlayerEntity
}

@Injectable()
export class JoinTeamUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    @Inject(PLAYER_REPOSITORY) private readonly playerRepo: IPlayerRepository,
  ) {}

  async getTeamByToken(token: string): Promise<TeamEntity> {
    const team = await this.teamRepo.findByInviteToken(token)
    if (!team) throw new NotFoundError('Team', token)
    return team
  }

  async execute(token: string, dto: RegisterPlayerDto): Promise<JoinTeamResult> {
    const team = await this.teamRepo.findByInviteToken(token)
    if (!team) throw new NotFoundError('Team', token)

    const player = await this.playerRepo.create({
      teamId: team.id,
      fullName: dto.fullName,
      birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
      document: dto.document,
      documentType: dto.documentType,
      jerseyNumber: dto.jerseyNumber,
      preferredFoot: dto.preferredFoot,
      mainPosition: dto.mainPosition,
      subPositions: dto.subPositions,
    })

    return { team, player }
  }
}
