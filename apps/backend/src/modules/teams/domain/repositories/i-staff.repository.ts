import { StaffMemberEntity } from '../entities/staff-member.entity'
import { StaffRole } from '../enums'

export interface CreateStaffData {
  teamId: string
  fullName: string
  document?: string | null
  licenseNumber?: string | null
  role?: StaffRole
}

export interface UpdateStaffData {
  fullName?: string
  document?: string | null
  licenseNumber?: string | null
  role?: StaffRole
}

export interface IStaffRepository {
  findById(id: string): Promise<StaffMemberEntity | null>
  findByTeamId(teamId: string): Promise<StaffMemberEntity[]>
  create(data: CreateStaffData): Promise<StaffMemberEntity>
  update(id: string, data: UpdateStaffData): Promise<StaffMemberEntity>
  delete(id: string): Promise<void>
}

export const STAFF_REPOSITORY = 'STAFF_REPOSITORY'
