export class AuditLogEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly action: string,
    public readonly resource: string | null,
    public readonly resourceId: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}
}
