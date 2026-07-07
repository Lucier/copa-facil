import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { ISumulaRepository} from '../../domain/repositories/i-sumula.repository'
import { SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { UpdateObservationsDto } from '../dtos/update-observations.dto'

@Injectable()
export class UpdateObservationsUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
  ) {}

  async execute(matchId: string, dto: UpdateObservationsDto): Promise<SumulaEntity> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    return this.sumulaRepo.update(sumula.id, { observations: dto.observations })
  }
}
