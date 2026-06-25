import { JudgeRole, LicenseCategory } from '../enums'

export class JudgeEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly document: string | null,
    public readonly licenseNumber: string | null,
    public readonly licenseCategory: LicenseCategory | null,
    public readonly role: JudgeRole,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly photoUrl: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
