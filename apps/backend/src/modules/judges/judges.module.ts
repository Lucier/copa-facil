import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { JUDGE_REPOSITORY } from './domain/repositories/i-judge.repository'
import { CreateJudgeUseCase } from './application/use-cases/create-judge.use-case'
import { ListJudgesUseCase } from './application/use-cases/list-judges.use-case'
import { GetJudgeUseCase } from './application/use-cases/get-judge.use-case'
import { UpdateJudgeUseCase } from './application/use-cases/update-judge.use-case'
import { DeleteJudgeUseCase } from './application/use-cases/delete-judge.use-case'
import { DrizzleJudgeRepository } from './infrastructure/repositories/drizzle-judge.repository'
import { JudgesController } from './presentation/controllers/judges.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: JUDGE_REPOSITORY, useClass: DrizzleJudgeRepository },
    CreateJudgeUseCase,
    ListJudgesUseCase,
    GetJudgeUseCase,
    UpdateJudgeUseCase,
    DeleteJudgeUseCase,
  ],
  controllers: [JudgesController],
})
export class JudgesModule {}
