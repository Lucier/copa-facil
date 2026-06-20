import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'
import { StaffRole } from '../../domain/enums'

export interface StaffRow {
  id: string
  team_id: string
  full_name: string
  document: string | null
  license_number: string | null
  role: string
  created_at: Date
  updated_at: Date
}

export class StaffMapper {
  static toEntity(row: StaffRow): StaffMemberEntity {
    return new StaffMemberEntity(
      row.id,
      row.team_id,
      row.full_name,
      row.document,
      row.license_number,
      row.role as StaffRole,
      row.created_at,
      row.updated_at,
    )
  }
}
