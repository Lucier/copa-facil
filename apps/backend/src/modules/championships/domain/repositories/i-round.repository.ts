import { RoundEntity } from '../entities/round.entity'
import { MatchStubEntity } from '../entities/match-stub.entity'
import { RoundPhase } from '../enums'

export const ROUND_REPOSITORY = 'IRoundRepository'

export interface MatchInput {
  homeTeamId: string | null
  awayTeamId: string | null
  bracketSlot?: number
  groupId?: string
}

export interface RoundInput {
  number: number
  name: string
  phase: RoundPhase
  groupId?: string
  matches: MatchInput[]
}

export interface RoundWithMatches {
  round: RoundEntity
  matches: MatchStubEntity[]
}

export interface IRoundRepository {
  saveFixtures(
    championshipId: string,
    rounds: RoundInput[],
    groupMap?: Map<number, string>,  // orderIndex → saved group id
  ): Promise<RoundWithMatches[]>

  findWithMatchesByChampionshipId(
    championshipId: string,
  ): Promise<RoundWithMatches[]>
}
