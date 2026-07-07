import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'
import { IStaffRepository} from '../../domain/repositories/i-staff.repository'
import { STAFF_REPOSITORY } from '../../domain/repositories/i-staff.repository'
import { UpdateStaffDto } from '../dtos/update-staff.dto'

@Injectable()
export class UpdateStaffUseCase {
  constructor(@Inject(STAFF_REPOSITORY) private readonly repo: IStaffRepository) {}

  async execute(id: string, dto: UpdateStaffDto): Promise<StaffMemberEntity> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('StaffMember', id)
    return this.repo.update(id, dto)
  }
}
