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

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBER_MGMT_REPOSITORY)
    private readonly memberRepo: IMemberMgmtRepository,
  ) {}

  async execute(memberId: string, currentUser: JwtPayload): Promise<void> {
    const member = await this.memberRepo.findById(memberId)
    if (!member) throw new NotFoundException('Member not found')

    if (member.userId === currentUser.sub) {
      throw new ForbiddenException('Cannot remove yourself from the organization')
    }

    if (member.role === UserRole.ORGANIZADOR) {
      const count = await this.memberRepo.countByRole(UserRole.ORGANIZADOR)
      if (count <= 1) {
        throw new BadRequestException('Cannot remove the last organizador')
      }
    }

    await this.memberRepo.deactivate(memberId)
  }
}
