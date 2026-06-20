import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { TransferPlayerDto } from '../dtos/transfer-player.dto'

@Injectable()
export class TransferPlayerUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly playerRepo: IPlayerRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
  ) {}

  async execute(playerId: string, dto: TransferPlayerDto): Promise<PlayerEntity> {
    const player = await this.playerRepo.findById(playerId)
    if (!player) throw new NotFoundError('Player', playerId)

    const targetTeam = await this.teamRepo.findById(dto.toTeamId)
    if (!targetTeam) throw new NotFoundError('Team', dto.toTeamId)

    await this.playerRepo.createHistory({
      playerId,
      fromTeamId: player.teamId,
      toTeamId: dto.toTeamId,
      season: dto.season,
      note: dto.note,
    })

    return this.playerRepo.transferToTeam(playerId, dto.toTeamId)
  }
}
