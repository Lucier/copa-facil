import { UserRole } from '../roles.enum'

export class MemberEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly isActive: boolean,
    public readonly joinedAt: Date,
  ) {}
}
