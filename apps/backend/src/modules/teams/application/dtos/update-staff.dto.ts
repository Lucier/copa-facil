import { PartialType } from '@nestjs/swagger'
import { AssignStaffDto } from './assign-staff.dto'

export class UpdateStaffDto extends PartialType(AssignStaffDto) {}
