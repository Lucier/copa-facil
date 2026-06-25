import { OfficialRole } from '../enums'

export class MatchOfficialEntity {
  constructor(
    public readonly id: string,
    public readonly matchId: string,
    public readonly name: string,
    public readonly role: OfficialRole,
    public readonly licenseNumber: string | null,
    public readonly createdAt: Date,
  ) {}
}
