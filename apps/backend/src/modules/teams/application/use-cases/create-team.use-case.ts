import { Inject, Injectable } from '@nestjs/common'
import { TeamEntity } from '../../domain/entities/team.entity'
import { ITeamRepository} from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { CreateTeamDto } from '../dtos/create-team.dto'

@Injectable()
export class CreateTeamUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: ITeamRepository) {}

  execute(dto: CreateTeamDto): Promise<TeamEntity> {
    return this.repo.create(dto)
  }
}
