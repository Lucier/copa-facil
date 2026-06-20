import { MemberEntity } from '../entities/member.entity'
import { UserRole } from '../roles.enum'

export const MEMBERSHIP_REPOSITORY = 'IMembershipRepository'

export interface CreateMemberData {
  userId: string
  role: UserRole
}

export interface IMembershipRepository {
  findByUserId(userId: string): Promise<MemberEntity | null>
  create(data: CreateMemberData): Promise<MemberEntity>
}
