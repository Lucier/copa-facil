import { DocumentType, PreferredFoot } from '../enums'

export class PlayerEntity {
  constructor(
    public readonly id: string,
    public readonly teamId: string,
    public readonly fullName: string,
    public readonly photoUrl: string | null,
    public readonly birthdate: Date | null,
    public readonly document: string | null,
    public readonly documentType: DocumentType,
    public readonly jerseyNumber: number | null,
    public readonly preferredFoot: PreferredFoot,
    public readonly mainPosition: string,
    public readonly subPositions: string[],
    public readonly goals: number,
    public readonly yellowCards: number,
    public readonly redCards: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
