import { Inject, Injectable } from '@nestjs/common'
import { StandingEntity } from '../../domain/entities/standing.entity'
import { IStandingRepository, STANDING_REPOSITORY } from '../../domain/repositories/i-standing.repository'

@Injectable()
export class GetStandingsUseCase {
  constructor(@Inject(STANDING_REPOSITORY) private readonly repo: IStandingRepository) {}

  execute(championshipId: string, groupId?: string): Promise<StandingEntity[]> {
    if (groupId) return this.repo.findByChampionshipAndGroup(championshipId, groupId)
    return this.repo.findByChampionshipId(championshipId)
  }
}
