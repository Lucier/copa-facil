import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { ISumulaRepository, SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { ILineupRepository, LINEUP_REPOSITORY } from '../../domain/repositories/i-lineup.repository'
import { MatchLineupEntity } from '../../domain/entities/match-lineup.entity'
import { AddLineupDto } from '../dtos/add-lineup.dto'

@Injectable()
export class AddPlayerToLineupUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(LINEUP_REPOSITORY) private readonly lineupRepo: ILineupRepository,
  ) {}

  async execute(matchId: string, dto: AddLineupDto): Promise<MatchLineupEntity> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    const duplicate = await this.lineupRepo.findByMatchAndPlayer(matchId, dto.playerId)
    if (duplicate) throw new AppError('Player is already in the lineup', 'CONFLICT', 409)

    return this.lineupRepo.create({
      matchId,
      teamId: dto.teamId,
      playerId: dto.playerId,
      jerseyNumber: dto.jerseyNumber,
      position: dto.position,
      isStarter: dto.isStarter ?? true,
      isCaptain: dto.isCaptain ?? false,
    })
  }
}
