import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { RegistrationDocumentEntity } from '../../domain/entities/registration-document.entity'
import {
  IRegistrationDocumentRepository,
  REGISTRATION_DOCUMENT_REPOSITORY,
} from '../../domain/repositories/i-registration-document.repository'
import {
  IRegistrationRepository,
  REGISTRATION_REPOSITORY,
} from '../../domain/repositories/i-registration.repository'
import { UploadDocumentDto } from '../dtos/upload-document.dto'

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(REGISTRATION_REPOSITORY) private readonly regRepo: IRegistrationRepository,
    @Inject(REGISTRATION_DOCUMENT_REPOSITORY) private readonly docRepo: IRegistrationDocumentRepository,
  ) {}

  async execute(registrationId: string, dto: UploadDocumentDto): Promise<RegistrationDocumentEntity> {
    const reg = await this.regRepo.findById(registrationId)
    if (!reg) throw new NotFoundError('Registration', registrationId)

    return this.docRepo.create({
      registrationId,
      playerId: dto.playerId ?? null,
      documentType: dto.documentType,
      fileUrl: dto.fileUrl,
    })
  }
}
