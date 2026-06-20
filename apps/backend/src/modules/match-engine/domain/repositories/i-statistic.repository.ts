import { PlayerStatisticEntity } from '../entities/player-statistic.entity'

export interface UpsertPlayerStatisticData {
  championshipId: string
  teamId: string
  playerId: string
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

export interface IStatisticRepository {
  findByChampionshipId(championshipId: string): Promise<PlayerStatisticEntity[]>
  upsert(data: UpsertPlayerStatisticData): Promise<PlayerStatisticEntity>
  upsertMany(data: UpsertPlayerStatisticData[]): Promise<void>
}

export const STATISTIC_REPOSITORY = 'STATISTIC_REPOSITORY'
