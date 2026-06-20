import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { RegistrationRequestEntity } from '../../domain/entities/registration-request.entity'
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'

@Injectable()
export class GetRegistrationUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly repo: IRegistrationRepository,
  ) {}

  async execute(id: string): Promise<RegistrationRequestEntity> {
    const reg = await this.repo.findById(id)
    if (!reg) throw new NotFoundError('Registration', id)
    return reg
  }
}
