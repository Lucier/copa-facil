import { DocumentStatus, RegistrationDocumentType } from '../enums'

export class RegistrationDocumentEntity {
  constructor(
    public readonly id: string,
    public readonly registrationId: string,
    public readonly playerId: string | null,
    public readonly documentType: RegistrationDocumentType,
    public readonly fileUrl: string,
    public readonly status: DocumentStatus,
    public readonly rejectionReason: string | null,
    public readonly reviewedBy: string | null,
    public readonly uploadedAt: Date,
    public readonly reviewedAt: Date | null,
  ) {}
}
