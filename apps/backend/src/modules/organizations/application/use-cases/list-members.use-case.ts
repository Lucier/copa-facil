import { Inject, Injectable } from '@nestjs/common'
import {
  IMemberMgmtRepository,
  MEMBER_MGMT_REPOSITORY,
  MemberWithUser,
} from '../../domain/repositories/i-member-mgmt.repository'

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject(MEMBER_MGMT_REPOSITORY)
    private readonly memberRepo: IMemberMgmtRepository,
  ) {}

  execute(): Promise<MemberWithUser[]> {
    return this.memberRepo.listActive()
  }
}
