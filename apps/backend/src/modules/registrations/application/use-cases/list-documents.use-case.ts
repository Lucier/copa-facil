import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { RegistrationDocumentEntity } from '../../domain/entities/registration-document.entity'
import {
  IRegistrationDocumentRepository} from '../../domain/repositories/i-registration-document.repository'
import {
  REGISTRATION_DOCUMENT_REPOSITORY,
} from '../../domain/repositories/i-registration-document.repository'
import {
  IRegistrationRepository} from '../../domain/repositories/i-registration.repository'
import {
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly regRepo: IRegistrationRepository,
    @Inject(REGISTRATION_DOCUMENT_REPOSITORY) private readonly docRepo: IRegistrationDocumentRepository,
  ) {}

  async execute(registrationId: string): Promise<RegistrationDocumentEntity[]> {
    const reg = await this.regRepo.findById(registrationId)
    if (!reg) throw new NotFoundError('Registration', registrationId)
    return this.docRepo.findByRegistrationId(registrationId)
  }
}
