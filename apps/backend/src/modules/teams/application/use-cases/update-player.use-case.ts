import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { IPlayerRepository} from '../../domain/repositories/i-player.repository'
import { PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'
import { UpdatePlayerDto } from '../dtos/update-player.dto'

@Injectable()
export class UpdatePlayerUseCase {
  constructor(@Inject(PLAYER_REPOSITORY) private readonly repo: IPlayerRepository) {}

  async execute(id: string, dto: UpdatePlayerDto): Promise<PlayerEntity> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Player', id)
    return this.repo.update(id, {
      fullName: dto.fullName,
      photoUrl: dto.photoUrl,
      birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
      document: dto.document,
      documentType: dto.documentType,
      jerseyNumber: dto.jerseyNumber,
      preferredFoot: dto.preferredFoot,
      mainPosition: dto.mainPosition,
      subPositions: dto.subPositions,
    })
  }
}
