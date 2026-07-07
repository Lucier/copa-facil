import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { JudgeEntity } from '../../domain/entities/judge.entity'
import { IJudgeRepository} from '../../domain/repositories/i-judge.repository'
import { JUDGE_REPOSITORY } from '../../domain/repositories/i-judge.repository'

@Injectable()
export class GetJudgeUseCase {
  constructor(@Inject(JUDGE_REPOSITORY) private readonly repo: IJudgeRepository) {}

  async execute(id: string): Promise<JudgeEntity> {
    const judge = await this.repo.findById(id)
    if (!judge) throw new NotFoundError('Judge', id)
    return judge
  }
}
