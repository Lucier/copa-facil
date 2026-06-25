import { MatchOfficialEntity } from '../entities/match-official.entity'
import { OfficialRole } from '../enums'

export interface CreateOfficialData {
  matchId: string
  name: string
  role: OfficialRole
  licenseNumber?: string
}

export interface IOfficialRepository {
  findByMatchId(matchId: string): Promise<MatchOfficialEntity[]>
  findById(id: string): Promise<MatchOfficialEntity | null>
  create(data: CreateOfficialData): Promise<MatchOfficialEntity>
  delete(id: string): Promise<void>
}

export const OFFICIAL_REPOSITORY = 'OFFICIAL_REPOSITORY'
