export class ApiKeyEntity {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly organizationSlug: string,
    public readonly schemaName: string,
    public readonly name: string,
    public readonly keyHash: string,
    public readonly isActive: boolean,
    public readonly lastUsedAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
