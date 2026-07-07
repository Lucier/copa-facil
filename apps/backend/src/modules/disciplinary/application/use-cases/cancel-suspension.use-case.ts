import { Inject, Injectable } from '@nestjs/common'
import { AppError, NotFoundError } from '../../../../shared/errors'
import { SuspensionStatus } from '../../domain/enums'
import { SuspensionEntity } from '../../domain/entities/suspension.entity'
import {
  ISuspensionRepository} from '../../domain/repositories/i-suspension.repository'
import {
  SUSPENSION_REPOSITORY,
} from '../../domain/repositories/i-suspension.repository'

@Injectable()
export class CancelSuspensionUseCase {
  constructor(
    @Inject(SUSPENSION_REPOSITORY) private readonly repo: ISuspensionRepository,
  ) {}

  async execute(suspensionId: string): Promise<SuspensionEntity> {
    const suspension = await this.repo.findById(suspensionId)
    if (!suspension) throw new NotFoundError('Suspension', suspensionId)
    if (suspension.status === SuspensionStatus.CANCELADA) {
      throw new AppError('Suspension is already cancelled', 'INVALID_STATE', 422)
    }

    return this.repo.update(suspensionId, { status: SuspensionStatus.CANCELADA })
  }
}
