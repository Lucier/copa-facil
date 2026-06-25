import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { JudgeEntity } from '../../domain/entities/judge.entity'
import { IJudgeRepository, JUDGE_REPOSITORY } from '../../domain/repositories/i-judge.repository'
import { UpdateJudgeDto } from '../dtos/update-judge.dto'

@Injectable()
export class UpdateJudgeUseCase {
  constructor(@Inject(JUDGE_REPOSITORY) private readonly repo: IJudgeRepository) {}

  async execute(id: string, dto: UpdateJudgeDto): Promise<JudgeEntity> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Judge', id)
    return this.repo.update(id, dto)
  }
}
