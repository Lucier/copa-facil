import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { ISumulaRepository, SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { ILineupRepository, LINEUP_REPOSITORY } from '../../domain/repositories/i-lineup.repository'

@Injectable()
export class RemovePlayerFromLineupUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(LINEUP_REPOSITORY) private readonly lineupRepo: ILineupRepository,
  ) {}

  async execute(matchId: string, lineupId: string): Promise<void> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    const entry = await this.lineupRepo.findById(lineupId)
    if (!entry) throw new NotFoundError('LineupEntry', lineupId)
    if (entry.matchId !== matchId) throw new AppError('Lineup entry does not belong to this match', 'INVALID_STATE', 422)

    await this.lineupRepo.delete(lineupId)
  }
}
