export const AUDIT_REPOSITORY = 'IAuditRepository'

export interface AuditLogData {
  userId: string
  action: string
  resource?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

export interface IAuditRepository {
  log(data: AuditLogData): Promise<void>
}
