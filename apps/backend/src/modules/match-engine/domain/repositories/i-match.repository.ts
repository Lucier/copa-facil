import { MatchStatus } from '../../../championships/domain/enums'
import { MatchEntity } from '../entities/match.entity'

export interface IMatchRepository {
  findById(id: string): Promise<MatchEntity | null>
  findByChampionshipId(championshipId: string): Promise<MatchEntity[]>
  findFinishedByChampionshipId(championshipId: string): Promise<MatchEntity[]>
  updateStatus(id: string, status: MatchStatus, timestamps?: { startedAt?: Date; endedAt?: Date }): Promise<MatchEntity>
  updateScore(id: string, homeScore: number, awayScore: number): Promise<MatchEntity>
}

export const MATCH_REPOSITORY = 'MATCH_REPOSITORY'
