import { Inject, Injectable } from '@nestjs/common'
import { JudgeEntity } from '../../domain/entities/judge.entity'
import { IJudgeRepository} from '../../domain/repositories/i-judge.repository'
import { JUDGE_REPOSITORY } from '../../domain/repositories/i-judge.repository'
import { CreateJudgeDto } from '../dtos/create-judge.dto'

@Injectable()
export class CreateJudgeUseCase {
  constructor(@Inject(JUDGE_REPOSITORY) private readonly repo: IJudgeRepository) {}

  execute(dto: CreateJudgeDto): Promise<JudgeEntity> {
    return this.repo.create({
      fullName: dto.fullName,
      document: dto.document,
      licenseNumber: dto.licenseNumber,
      licenseCategory: dto.licenseCategory,
      role: dto.role,
      phone: dto.phone,
      email: dto.email,
      photoUrl: dto.photoUrl,
    })
  }
}
