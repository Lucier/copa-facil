import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { RegistrationDocumentEntity } from '../../domain/entities/registration-document.entity'
import {
  IRegistrationDocumentRepository,
  REGISTRATION_DOCUMENT_REPOSITORY,
} from '../../domain/repositories/i-registration-document.repository'
import { ReviewDocumentDto } from '../dtos/review-document.dto'

@Injectable()
export class ReviewDocumentUseCase {
  constructor(
    @Inject(REGISTRATION_DOCUMENT_REPOSITORY) private readonly repo: IRegistrationDocumentRepository,
  ) {}

  async execute(
    id: string,
    dto: ReviewDocumentDto,
    reviewedBy: string,
  ): Promise<RegistrationDocumentEntity> {
    const doc = await this.repo.findById(id)
    if (!doc) throw new NotFoundError('Document', id)

    return this.repo.updateStatus(id, dto.status, reviewedBy, dto.rejectionReason ?? null)
  }
}
