import { RegistrationStatus } from '../enums'

export class RegistrationRequestEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly teamId: string,
    public readonly status: RegistrationStatus,
    public readonly submittedBy: string,
    public readonly reviewedBy: string | null,
    public readonly reviewNote: string | null,
    public readonly submittedAt: Date,
    public readonly reviewedAt: Date | null,
  ) {}
}
