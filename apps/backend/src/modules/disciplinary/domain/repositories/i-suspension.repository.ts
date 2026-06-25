import { SuspensionSource, SuspensionStatus } from '../enums'
import { SuspensionEntity } from '../entities/suspension.entity'

export interface CreateSuspensionData {
  championshipId: string
  playerId: string
  teamId: string
  reason: string
  source: SuspensionSource
  matchesToServe: number
  eventId?: string | null
  notes?: string | null
}

export interface UpdateSuspensionData {
  matchesServed?: number
  status?: SuspensionStatus
  notes?: string | null
}

export interface ISuspensionRepository {
  findByChampionshipId(championshipId: string): Promise<SuspensionEntity[]>
  findByPlayer(playerId: string, championshipId: string): Promise<SuspensionEntity[]>
  findActiveByPlayer(playerId: string, championshipId: string): Promise<SuspensionEntity[]>
  findByEventId(eventId: string): Promise<SuspensionEntity | null>
  findById(id: string): Promise<SuspensionEntity | null>
  create(data: CreateSuspensionData): Promise<SuspensionEntity>
  update(id: string, data: UpdateSuspensionData): Promise<SuspensionEntity>
}

export const SUSPENSION_REPOSITORY = 'SUSPENSION_REPOSITORY'
