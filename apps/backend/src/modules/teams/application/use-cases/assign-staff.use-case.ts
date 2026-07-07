import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'
import { IStaffRepository} from '../../domain/repositories/i-staff.repository'
import { STAFF_REPOSITORY } from '../../domain/repositories/i-staff.repository'
import { ITeamRepository} from '../../domain/repositories/i-team.repository'
import { TEAM_REPOSITORY } from '../../domain/repositories/i-team.repository'
import { AssignStaffDto } from '../dtos/assign-staff.dto'

@Injectable()
export class AssignStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY) private readonly staffRepo: IStaffRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
  ) {}

  async execute(teamId: string, dto: AssignStaffDto): Promise<StaffMemberEntity> {
    const team = await this.teamRepo.findById(teamId)
    if (!team) throw new NotFoundError('Team', teamId)
    return this.staffRepo.create({ teamId, ...dto })
  }
}
