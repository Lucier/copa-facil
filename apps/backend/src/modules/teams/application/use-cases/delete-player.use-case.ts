import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'

@Injectable()
export class DeletePlayerUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly repo: IPlayerRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Player', id)
    return this.repo.delete(id)
  }
}
