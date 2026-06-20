import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'

@Injectable()
export class ListPlayersUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly playerRepo: IPlayerRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
  ) {}

  async execute(teamId: string): Promise<PlayerEntity[]> {
    const team = await this.teamRepo.findById(teamId)
    if (!team) throw new NotFoundError('Team', teamId)
    return this.playerRepo.findByTeamId(teamId)
  }
}
