import { ChampionshipEntity } from '../entities/championship.entity'
import { ChampionshipStatus, TournamentFormat } from '../enums'

export const CHAMPIONSHIP_REPOSITORY = 'IChampionshipRepository'

export interface CreateChampionshipData {
  name: string
  season: string
  format: TournamentFormat
  legs: number
  logoUrl?: string | null
}

export interface IChampionshipRepository {
  findById(id: string): Promise<ChampionshipEntity | null>
  findAll(): Promise<ChampionshipEntity[]>
  create(data: CreateChampionshipData): Promise<ChampionshipEntity>
  updateStatus(id: string, status: ChampionshipStatus): Promise<void>
}
