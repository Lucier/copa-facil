import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'

@Injectable()
export class GetPlayerUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly repo: IPlayerRepository) {}

  async execute(id: string): Promise<PlayerEntity> {
    const player = await this.repo.findById(id)
    if (!player) throw new NotFoundError('Player', id)
    return player
  }
}
