import { JudgeEntity } from '../entities/judge.entity'
import { JudgeRole, LicenseCategory } from '../enums'

export interface CreateJudgeData {
  fullName: string
  document?: string
  licenseNumber?: string
  licenseCategory?: LicenseCategory
  role: JudgeRole
  phone?: string
  email?: string
  photoUrl?: string
}

export interface UpdateJudgeData {
  fullName?: string
  document?: string | null
  licenseNumber?: string | null
  licenseCategory?: LicenseCategory | null
  role?: JudgeRole
  phone?: string | null
  email?: string | null
  photoUrl?: string | null
  isActive?: boolean
}

export interface IJudgeRepository {
  findAll(): Promise<JudgeEntity[]>
  findById(id: string): Promise<JudgeEntity | null>
  create(data: CreateJudgeData): Promise<JudgeEntity>
  update(id: string, data: UpdateJudgeData): Promise<JudgeEntity>
  delete(id: string): Promise<void>
}

export const JUDGE_REPOSITORY = 'JUDGE_REPOSITORY'
