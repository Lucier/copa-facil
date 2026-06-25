import { SumulaEntity } from '../entities/sumula.entity'

export interface CreateSumulaData {
  matchId: string
  championshipId: string
  venue?: string
}

export interface UpdateSumulaData {
  venue?: string
  observations?: string
  status?: string
  closedAt?: Date
  closedBy?: string
  integrityHash?: string
}

export interface ISumulaRepository {
  findByMatchId(matchId: string): Promise<SumulaEntity | null>
  create(data: CreateSumulaData): Promise<SumulaEntity>
  update(id: string, data: UpdateSumulaData): Promise<SumulaEntity>
}

export const SUMULA_REPOSITORY = 'SUMULA_REPOSITORY'
