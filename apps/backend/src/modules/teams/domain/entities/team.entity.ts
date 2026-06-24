export class TeamEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly acronym: string | null,
    public readonly city: string | null,
    public readonly nickname: string | null,
    public readonly logoUrl: string | null,
    public readonly primaryColor: string | null,
    public readonly secondaryColor: string | null,
    public readonly seed: number | null,
    public readonly inviteToken: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
