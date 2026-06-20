import { DocumentStatus, RegistrationDocumentType } from '../enums'
import { RegistrationDocumentEntity } from '../entities/registration-document.entity'

export interface CreateDocumentData {
  registrationId: string
  playerId?: string | null
  documentType: RegistrationDocumentType
  fileUrl: string
}

export interface IRegistrationDocumentRepository {
  findById(id: string): Promise<RegistrationDocumentEntity | null>
  findByRegistrationId(registrationId: string): Promise<RegistrationDocumentEntity[]>
  create(data: CreateDocumentData): Promise<RegistrationDocumentEntity>
  updateStatus(
    id: string,
    status: DocumentStatus,
    reviewedBy: string,
    rejectionReason?: string | null,
  ): Promise<RegistrationDocumentEntity>
}

export const REGISTRATION_DOCUMENT_REPOSITORY = 'REGISTRATION_DOCUMENT_REPOSITORY'
