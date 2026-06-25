import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { IMatchRepository, MATCH_REPOSITORY } from '../../../match-engine/domain/repositories/i-match.repository'
import { ISumulaRepository, SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { OpenSumulaDto } from '../dtos/open-sumula.dto'

@Injectable()
export class OpenSumulaUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepo: IMatchRepository,
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
  ) {}

  async execute(matchId: string, dto: OpenSumulaDto): Promise<SumulaEntity> {
    const match = await this.matchRepo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)

    const existing = await this.sumulaRepo.findByMatchId(matchId)
    if (existing) throw new AppError('Sumula already exists for this match', 'CONFLICT', 409)

    return this.sumulaRepo.create({
      matchId,
      championshipId: match.championshipId,
      venue: dto.venue,
    })
  }
}
