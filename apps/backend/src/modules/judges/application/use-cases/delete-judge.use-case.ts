import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { IJudgeRepository} from '../../domain/repositories/i-judge.repository'
import { JUDGE_REPOSITORY } from '../../domain/repositories/i-judge.repository'

@Injectable()
export class DeleteJudgeUseCase {
  constructor(@Inject(JUDGE_REPOSITORY) private readonly repo: IJudgeRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Judge', id)
    return this.repo.delete(id)
  }
}
