import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { IPlayerRepository, PLAYER_REPOSITORY } from '../../domain/repositories/i-player.repository'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { RegisterPlayerDto } from '../dtos/register-player.dto'

@Injectable()
export class RegisterPlayerUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly playerRepo: IPlayerRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
  ) {}

  async execute(teamId: string, dto: RegisterPlayerDto): Promise<PlayerEntity> {
    const team = await this.teamRepo.findById(teamId)
    if (!team) throw new NotFoundError('Team', teamId)

    return this.playerRepo.create({
      teamId,
      fullName: dto.fullName,
      photoUrl: dto.photoUrl,
      birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
      document: dto.document,
      documentType: dto.documentType,
      jerseyNumber: dto.jerseyNumber,
      preferredFoot: dto.preferredFoot,
      mainPosition: dto.mainPosition,
      subPositions: dto.subPositions,
    })
  }
}
