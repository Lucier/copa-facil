import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'
import { IStaffRepository, STAFF_REPOSITORY } from '../../domain/repositories/i-staff.repository'
import { ITeamRepository, TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'

@Injectable()
export class ListStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY) private readonly staffRepo: IStaffRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
  ) {}

  async execute(teamId: string): Promise<StaffMemberEntity[]> {
    const team = await this.teamRepo.findById(teamId)
    if (!team) throw new NotFoundError('Team', teamId)
    return this.staffRepo.findByTeamId(teamId)
  }
}
