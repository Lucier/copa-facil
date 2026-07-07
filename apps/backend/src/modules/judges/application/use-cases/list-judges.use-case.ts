import { Inject, Injectable } from '@nestjs/common'
import { JudgeEntity } from '../../domain/entities/judge.entity'
import { IJudgeRepository} from '../../domain/repositories/i-judge.repository'
import { JUDGE_REPOSITORY } from '../../domain/repositories/i-judge.repository'

@Injectable()
export class ListJudgesUseCase {
  constructor(@Inject(JUDGE_REPOSITORY) private readonly repo: IJudgeRepository) {}

  execute(): Promise<JudgeEntity[]> {
    return this.repo.findAll()
  }
}
