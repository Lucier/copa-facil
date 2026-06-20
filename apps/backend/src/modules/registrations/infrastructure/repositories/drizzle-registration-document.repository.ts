import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { RegistrationDocumentEntity } from '../../domain/entities/registration-document.entity'
import { DocumentStatus, RegistrationDocumentType } from '../../domain/enums'
import {
  CreateDocumentData,
  IRegistrationDocumentRepository,
} from '../../domain/repositories/i-registration-document.repository'

interface DocRow {
  id: string
  registration_id: string
  player_id: string | null
  document_type: string
  file_url: string
  status: string
  rejection_reason: string | null
  reviewed_by: string | null
  uploaded_at: Date
  reviewed_at: Date | null
}

function toEntity(r: DocRow): RegistrationDocumentEntity {
  return new RegistrationDocumentEntity(
    r.id, r.registration_id, r.player_id, r.document_type as RegistrationDocumentType,
    r.file_url, r.status as DocumentStatus, r.rejection_reason, r.reviewed_by,
    r.uploaded_at, r.reviewed_at,
  )
}

@Injectable()
export class DrizzleRegistrationDocumentRepository implements IRegistrationDocumentRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<RegistrationDocumentEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<DocRow[]>`SELECT id, registration_id, player_id, document_type, file_url, status, rejection_reason, reviewed_by, uploaded_at, reviewed_at FROM registration_documents WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByRegistrationId(registrationId: string): Promise<RegistrationDocumentEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<DocRow[]>`SELECT id, registration_id, player_id, document_type, file_url, status, rejection_reason, reviewed_by, uploaded_at, reviewed_at FROM registration_documents WHERE registration_id = ${registrationId} ORDER BY uploaded_at ASC`,
    )
    return rows.map(toEntity)
  }

  async create(data: CreateDocumentData): Promise<RegistrationDocumentEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<DocRow[]>`
        INSERT INTO registration_documents (registration_id, player_id, document_type, file_url)
        VALUES (${data.registrationId}, ${data.playerId ?? null}, ${data.documentType}, ${data.fileUrl})
        RETURNING id, registration_id, player_id, document_type, file_url, status, rejection_reason, reviewed_by, uploaded_at, reviewed_at
      `,
    )
    return toEntity(rows[0])
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    reviewedBy: string,
    rejectionReason?: string | null,
  ): Promise<RegistrationDocumentEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<DocRow[]>`
        UPDATE registration_documents SET
          status           = ${status},
          reviewed_by      = ${reviewedBy},
          rejection_reason = ${rejectionReason ?? null},
          reviewed_at      = NOW()
        WHERE id = ${id}
        RETURNING id, registration_id, player_id, document_type, file_url, status, rejection_reason, reviewed_by, uploaded_at, reviewed_at
      `,
    )
    return toEntity(rows[0])
  }
}
