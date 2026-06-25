import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { ISumulaRepository, SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { IOfficialRepository, OFFICIAL_REPOSITORY } from '../../domain/repositories/i-official.repository'

@Injectable()
export class RemoveOfficialUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(OFFICIAL_REPOSITORY) private readonly officialRepo: IOfficialRepository,
  ) {}

  async execute(matchId: string, officialId: string): Promise<void> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    const official = await this.officialRepo.findById(officialId)
    if (!official) throw new NotFoundError('Official', officialId)
    if (official.matchId !== matchId) throw new AppError('Official does not belong to this match', 'INVALID_STATE', 422)

    await this.officialRepo.delete(officialId)
  }
}
