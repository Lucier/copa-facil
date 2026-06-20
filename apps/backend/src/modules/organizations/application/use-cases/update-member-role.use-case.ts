import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { UserRole } from '../../../auth/domain/roles.enum'
import {
  IMemberMgmtRepository,
  MEMBER_MGMT_REPOSITORY,
} from '../../domain/repositories/i-member-mgmt.repository'
import { UpdateMemberRoleDto } from '../dtos/update-member-role.dto'

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(MEMBER_MGMT_REPOSITORY)
    private readonly memberRepo: IMemberMgmtRepository,
  ) {}

  async execute(memberId: string, dto: UpdateMemberRoleDto, currentUser: JwtPayload): Promise<void> {
    const member = await this.memberRepo.findById(memberId)
    if (!member) throw new NotFoundException('Member not found')

    if (member.userId === currentUser.sub) {
      throw new ForbiddenException('Cannot change your own role')
    }

    if (member.role === UserRole.ORGANIZADOR && dto.role !== UserRole.ORGANIZADOR) {
      const count = await this.memberRepo.countByRole(UserRole.ORGANIZADOR)
      if (count <= 1) {
        throw new BadRequestException('Organization must have at least one organizador')
      }
    }

    await this.memberRepo.updateRole(memberId, dto.role)
  }
}
