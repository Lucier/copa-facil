import { TeamEntity } from '../entities/team.entity'

export interface CreateTeamData {
  name: string
  acronym?: string | null
  city?: string | null
  nickname?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  seed?: number | null
}

export interface UpdateTeamData {
  name?: string
  acronym?: string | null
  city?: string | null
  nickname?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  seed?: number | null
}

export interface ITeamRepository {
  findById(id: string): Promise<TeamEntity | null>
  findAll(): Promise<TeamEntity[]>
  create(data: CreateTeamData): Promise<TeamEntity>
  update(id: string, data: UpdateTeamData): Promise<TeamEntity>
  delete(id: string): Promise<void>
}

export const TEAM_REPOSITORY = 'TEAM_REPOSITORY'
