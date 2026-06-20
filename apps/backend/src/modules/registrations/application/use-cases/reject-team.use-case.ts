import { Inject, Injectable } from '@nestjs/common'
import { AppError, NotFoundError } from '../../../../shared/errors'
import { RegistrationRequestEntity } from '../../domain/entities/registration-request.entity'
import { RegistrationStatus } from '../../domain/enums'
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'
import { ReviewTeamDto } from '../dtos/review-team.dto'

@Injectable()
export class RejectTeamUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: IRegistrationRepository,
  ) {}

  async execute(id: string, dto: ReviewTeamDto, reviewedBy: string): Promise<RegistrationRequestEntity> {
    const reg = await this.repo.findById(id)
    if (!reg) throw new NotFoundError('Registration', id)
    if (reg.status === RegistrationStatus.REJEITADO) {
      throw new AppError('Registration is already rejected', 'INVALID_STATE', 422)
    }
    return this.repo.updateStatus(id, RegistrationStatus.REJEITADO, reviewedBy, dto.reviewNote)
  }
}
