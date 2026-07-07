import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { AppError } from '../../../../shared/errors/app-error'
import { MatchStatus } from '../../../championships/domain/enums'
import { MatchEntity } from '../../domain/entities/match.entity'
import { IMatchRepository} from '../../domain/repositories/i-match.repository'
import { MATCH_REPOSITORY } from '../../domain/repositories/i-match.repository'

@Injectable()
export class StartMatchUseCase {
  constructor(@Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository) {}

  async execute(matchId: string): Promise<MatchEntity> {
    const match = await this.repo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new AppError(`Match is already ${match.status}`, 'INVALID_STATE', 422)
    }
    return this.repo.updateStatus(matchId, MatchStatus.LIVE, { startedAt: new Date() })
  }
}
