import { Inject, Injectable } from '@nestjs/common'
import { AppError, ConflictError } from '../../../../shared/errors'
import { RegistrationRequestEntity } from '../../domain/entities/registration-request.entity'
import { RegistrationStatus } from '../../domain/enums'
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'
import { SubmitRegistrationDto } from '../dtos/submit-registration.dto'

@Injectable()
export class SubmitRegistrationUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: IRegistrationRepository,
  ) {}

  async execute(dto: SubmitRegistrationDto, submittedBy: string): Promise<RegistrationRequestEntity> {
    const existing = await this.repo.findByTeamAndChampionship(dto.teamId, dto.championshipId)
    if (existing && existing.status !== RegistrationStatus.REJEITADO) {
      throw new ConflictError('Registration', 'team + championship')
    }

    return this.repo.create({
      championshipId: dto.championshipId,
      teamId: dto.teamId,
      submittedBy,
    })
  }
}
