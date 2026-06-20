import { Inject, Injectable } from '@nestjs/common'
import { TeamEntity } from '../../domain/entities/team.entity'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'

@Injectable()
export class ListTeamsUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: ITeamRepository) {}

  execute(): Promise<TeamEntity[]> {
    return this.repo.findAll()
  }
}
