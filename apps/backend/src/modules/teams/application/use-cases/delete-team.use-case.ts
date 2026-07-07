import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { ITeamRepository} from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'

@Injectable()
export class DeleteTeamUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: ITeamRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Team', id)
    return this.repo.delete(id)
  }
}
