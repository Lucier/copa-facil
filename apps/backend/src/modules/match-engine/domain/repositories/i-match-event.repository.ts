import { CardColor, GoalType, MatchEventType } from '../enums'
import { MatchEventEntity } from '../entities/match-event.entity'

export interface CreateMatchEventData {
  matchId: string
  championshipId: string
  eventType: MatchEventType
  teamId: string
  playerId?: string | null
  assistPlayerId?: string | null
  playerOutId?: string | null
  playerInId?: string | null
  minute: number
  goalType?: GoalType | null
  cardColor?: CardColor | null
}

export interface IMatchEventRepository {
  findByMatchId(matchId: string): Promise<MatchEventEntity[]>
  findByChampionshipId(championshipId: string): Promise<MatchEventEntity[]>
  create(data: CreateMatchEventData): Promise<MatchEventEntity>
}

export const MATCH_EVENT_REPOSITORY = 'MATCH_EVENT_REPOSITORY'
