import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { POLL_REPOSITORY } from './domain/repositories/i-poll.repository'
import { DrizzlePollRepository } from './infrastructure/drizzle-poll.repository'
import {
  CreatePollUseCase, ListPollsUseCase, GetPollResultsUseCase,
  PublishPollUseCase, ClosePollUseCase, VotePollUseCase,
} from './application/use-cases/polls.use-cases'
import { PollsController } from './presentation/polls.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: POLL_REPOSITORY, useClass: DrizzlePollRepository },
    CreatePollUseCase,
    ListPollsUseCase,
    GetPollResultsUseCase,
    PublishPollUseCase,
    ClosePollUseCase,
    VotePollUseCase,
  ],
  controllers: [PollsController],
})
export class PollsModule {}
