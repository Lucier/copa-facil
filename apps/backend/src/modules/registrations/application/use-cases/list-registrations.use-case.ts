import { Inject, Injectable } from '@nestjs/common'
import { RegistrationRequestEntity } from '../../domain/entities/registration-request.entity'
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'

@Injectable()
export class ListRegistrationsUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: IRegistrationRepository,
  ) {}

  execute(championshipId: string): Promise<RegistrationRequestEntity[]> {
    return this.repo.findByChampionshipId(championshipId)
  }
}
