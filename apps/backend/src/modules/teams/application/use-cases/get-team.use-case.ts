import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { TeamEntity } from '../../domain/entities/team.entity'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'

@Injectable()
export class GetTeamUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: ITeamRepository) {}

  async execute(id: string): Promise<TeamEntity> {
    const team = await this.repo.findById(id)
    if (!team) throw new NotFoundError('Team', id)
    return team
  }
}
