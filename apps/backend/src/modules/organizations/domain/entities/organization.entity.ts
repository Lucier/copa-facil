export class OrganizationEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly schemaName: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
