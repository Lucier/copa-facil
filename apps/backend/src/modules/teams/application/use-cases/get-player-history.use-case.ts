import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerHistoryEntity } from '../../domain/entities/player-history.entity'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'

@Injectable()
export class GetPlayerHistoryUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly repo: IPlayerRepository) {}

  async execute(playerId: string): Promise<PlayerHistoryEntity[]> {
    const player = await this.repo.findById(playerId)
    if (!player) throw new NotFoundError('Player', playerId)
    return this.repo.findHistoryByPlayerId(playerId)
  }
}
