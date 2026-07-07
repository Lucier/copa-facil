import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { TeamEntity } from '../../domain/entities/team.entity'
import { ITeamRepository} from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { UpdateTeamDto } from '../dtos/update-team.dto'

@Injectable()
export class UpdateTeamUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: ITeamRepository) {}

  async execute(id: string, dto: UpdateTeamDto): Promise<TeamEntity> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Team', id)
    return this.repo.update(id, dto)
  }
}
