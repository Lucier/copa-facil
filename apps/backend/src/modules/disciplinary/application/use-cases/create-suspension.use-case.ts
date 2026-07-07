import { Inject, Injectable } from '@nestjs/common'
import { SuspensionSource } from '../../domain/enums'
import { SuspensionEntity } from '../../domain/entities/suspension.entity'
import {
  ISuspensionRepository} from '../../domain/repositories/i-suspension.repository'
import {
  SUSPENSION_REPOSITORY,
} from '../../domain/repositories/i-suspension.repository'
import { CreateSuspensionDto } from '../dtos/create-suspension.dto'

@Injectable()
export class CreateSuspensionUseCase {
  constructor(
    @Inject(SUSPENSION_REPOSITORY) private readonly repo: ISuspensionRepository,
  ) {}

  execute(championshipId: string, dto: CreateSuspensionDto): Promise<SuspensionEntity> {
    return this.repo.create({
      championshipId,
      playerId: dto.playerId,
      teamId: dto.teamId,
      reason: dto.reason,
      source: SuspensionSource.MANUAL,
      matchesToServe: dto.matchesToServe,
      notes: dto.notes,
    })
  }
}
