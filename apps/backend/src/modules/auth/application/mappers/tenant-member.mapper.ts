import { MemberEntity } from '../../domain/entities/member.entity'
import { UserRole } from '../../domain/roles.enum'

interface MembershipRow {
  id: string
  user_id: string
  role: string
  is_active: boolean
  joined_at: Date
}

export class TenantMemberMapper {
  static toDomain(row: MembershipRow): MemberEntity {
    return new MemberEntity(
      row.id,
      row.user_id,
      row.role as UserRole,
      row.is_active,
      row.joined_at,
    )
  }
}
