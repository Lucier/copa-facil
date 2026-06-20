import { PlayerEntity } from '../entities/player.entity'
import { PlayerHistoryEntity } from '../entities/player-history.entity'
import { DocumentType, PreferredFoot } from '../enums'

export interface CreatePlayerData {
  teamId: string
  fullName: string
  birthdate?: Date | null
  document?: string | null
  documentType?: DocumentType
  jerseyNumber?: number | null
  preferredFoot?: PreferredFoot
  mainPosition?: string
  subPositions?: string[]
}

export interface UpdatePlayerData {
  fullName?: string
  birthdate?: Date | null
  document?: string | null
  documentType?: DocumentType
  jerseyNumber?: number | null
  preferredFoot?: PreferredFoot
  mainPosition?: string
  subPositions?: string[]
}

export interface CreatePlayerHistoryData {
  playerId: string
  championshipId?: string | null
  fromTeamId?: string | null
  toTeamId?: string | null
  goals?: number
  yellowCards?: number
  redCards?: number
  season?: string | null
  note?: string | null
}

export interface IPlayerRepository {
  findById(id: string): Promise<PlayerEntity | null>
  findByTeamId(teamId: string): Promise<PlayerEntity[]>
  create(data: CreatePlayerData): Promise<PlayerEntity>
  update(id: string, data: UpdatePlayerData): Promise<PlayerEntity>
  delete(id: string): Promise<void>
  transferToTeam(playerId: string, toTeamId: string): Promise<PlayerEntity>
  findHistoryByPlayerId(playerId: string): Promise<PlayerHistoryEntity[]>
  createHistory(data: CreatePlayerHistoryData): Promise<PlayerHistoryEntity>
}

export const PLAYER_REPOSITORY = 'PLAYER_REPOSITORY'
