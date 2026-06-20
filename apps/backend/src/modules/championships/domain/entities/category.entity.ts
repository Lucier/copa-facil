export class CategoryEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {}
}
