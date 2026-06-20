import { StaffRole } from '../enums'

export class StaffMemberEntity {
  constructor(
    public readonly id: string,
    public readonly teamId: string,
    public readonly fullName: string,
    public readonly document: string | null,
    public readonly licenseNumber: string | null,
    public readonly role: StaffRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
