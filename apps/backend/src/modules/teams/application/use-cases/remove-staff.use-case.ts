import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { IStaffRepository} from '../../domain/repositories/i-staff.repository'
import { STAFF_REPOSITORY } from '../../domain/repositories/i-staff.repository'

@Injectable()
export class RemoveStaffUseCase {
  constructor(@Inject(STAFF_REPOSITORY) private readonly repo: IStaffRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('StaffMember', id)
    return this.repo.delete(id)
  }
}
