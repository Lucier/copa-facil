import { UserRole } from '../../../auth/domain/roles.enum'

export const MEMBER_MGMT_REPOSITORY = 'IMemberMgmtRepository'

export interface MemberWithUser {
  id: string
  userId: string
  role: UserRole
  isActive: boolean
  joinedAt: Date
  user: {
    name: string
    email: string
  }
}

export interface IMemberMgmtRepository {
  listActive(): Promise<MemberWithUser[]>
  findById(memberId: string): Promise<MemberWithUser | null>
  findByUserId(userId: string): Promise<{ id: string; role: UserRole } | null>
  countByRole(role: UserRole): Promise<number>
  updateRole(memberId: string, role: UserRole): Promise<void>
  deactivate(memberId: string): Promise<void>
  create(userId: string, role: UserRole): Promise<void>
}
