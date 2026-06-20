import { StandingEntity } from '../entities/standing.entity'

export interface UpsertStandingData {
  championshipId: string
  groupId: string | null
  teamId: string
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  yellowCards: number
  redCards: number
  fairPlayPoints: number
}

export interface IStandingRepository {
  findByChampionshipId(championshipId: string): Promise<StandingEntity[]>
  findByChampionshipAndGroup(championshipId: string, groupId: string): Promise<StandingEntity[]>
  upsert(data: UpsertStandingData): Promise<StandingEntity>
  upsertMany(data: UpsertStandingData[]): Promise<void>
}

export const STANDING_REPOSITORY = 'STANDING_REPOSITORY'
