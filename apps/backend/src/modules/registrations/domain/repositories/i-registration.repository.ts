import { RegistrationStatus } from '../enums'
import { RegistrationRequestEntity } from '../entities/registration-request.entity'

export interface CreateRegistrationData {
  championshipId: string
  teamId: string
  submittedBy: string
}

export interface IRegistrationRepository {
  findById(id: string): Promise<RegistrationRequestEntity | null>
  findByChampionshipId(championshipId: string): Promise<RegistrationRequestEntity[]>
  findByTeamAndChampionship(teamId: string, championshipId: string): Promise<RegistrationRequestEntity | null>
  create(data: CreateRegistrationData): Promise<RegistrationRequestEntity>
  updateStatus(
    id: string,
    status: RegistrationStatus,
    reviewedBy: string,
    reviewNote?: string | null,
  ): Promise<RegistrationRequestEntity>
}

export const REGISTRATION_REPOSITORY = 'REGISTRATION_REPOSITORY'
