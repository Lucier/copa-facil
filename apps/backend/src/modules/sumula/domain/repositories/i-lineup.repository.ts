import { MatchLineupEntity } from '../entities/match-lineup.entity'

export interface CreateLineupData {
  matchId: string
  teamId: string
  playerId: string
  jerseyNumber?: number
  position?: string
  isStarter?: boolean
  isCaptain?: boolean
}

export interface ILineupRepository {
  findByMatchId(matchId: string): Promise<MatchLineupEntity[]>
  findById(id: string): Promise<MatchLineupEntity | null>
  findByMatchAndPlayer(matchId: string, playerId: string): Promise<MatchLineupEntity | null>
  create(data: CreateLineupData): Promise<MatchLineupEntity>
  delete(id: string): Promise<void>
}

export const LINEUP_REPOSITORY = 'LINEUP_REPOSITORY'
