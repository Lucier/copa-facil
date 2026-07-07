import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { ISumulaRepository} from '../../domain/repositories/i-sumula.repository'
import { SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { IOfficialRepository} from '../../domain/repositories/i-official.repository'
import { OFFICIAL_REPOSITORY } from '../../domain/repositories/i-official.repository'
import { MatchOfficialEntity } from '../../domain/entities/match-official.entity'
import { AddOfficialDto } from '../dtos/add-official.dto'

@Injectable()
export class AddOfficialUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(OFFICIAL_REPOSITORY) private readonly officialRepo: IOfficialRepository,
  ) {}

  async execute(matchId: string, dto: AddOfficialDto): Promise<MatchOfficialEntity> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    return this.officialRepo.create({
      matchId,
      name: dto.name,
      role: dto.role,
      licenseNumber: dto.licenseNumber,
    })
  }
}
