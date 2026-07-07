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
export class ServeSuspensionUseCase {
  constructor(
    @Inject(SUSPENSION_REPOSITORY) private readonly repo: ISuspensionRepository,
  ) {}

  async execute(suspensionId: string): Promise<SuspensionEntity> {
    const suspension = await this.repo.findById(suspensionId)
    if (!suspension) throw new NotFoundError('Suspension', suspensionId)
    if (suspension.status !== SuspensionStatus.ATIVA) {
      throw new AppError('Suspension is not active', 'INVALID_STATE', 422)
    }

    const newServed = suspension.matchesServed + 1
    const newStatus =
      newServed >= suspension.matchesToServe ? SuspensionStatus.CUMPRIDA : SuspensionStatus.ATIVA

    return this.repo.update(suspensionId, {
      matchesServed: newServed,
      status: newStatus,
    })
  }
}
