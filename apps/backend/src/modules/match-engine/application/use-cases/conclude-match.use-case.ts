import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotFoundError } from '../../../../shared/errors'
import { AppError } from '../../../../shared/errors/app-error'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchStatus } from '../../../championships/domain/enums'
import { MatchEntity } from '../../domain/entities/match.entity'
import { MatchConcludedDomainEvent } from '../../domain/events/match-concluded.event'
import { IMatchRepository} from '../../domain/repositories/i-match.repository'
import { MATCH_REPOSITORY } from '../../domain/repositories/i-match.repository'
import { ConcludeMatchDto } from '../dtos/conclude-match.dto'

@Injectable()
export class ConcludeMatchUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly repo: IMatchRepository,
    private readonly emitter: EventEmitter2,
  ) {}

  async execute(matchId: string, dto: ConcludeMatchDto): Promise<MatchEntity> {
    const match = await this.repo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)
    if (match.status !== MatchStatus.LIVE) {
      throw new AppError('Match is not live', 'INVALID_STATE', 422)
    }

    await this.repo.updateScore(matchId, dto.homeScore, dto.awayScore)
    const concluded = await this.repo.updateStatus(matchId, MatchStatus.FINISHED, {
      endedAt: new Date(),
    })

    const tenantSchema = TenantContext.getSchema()
    this.emitter.emit(
      MatchConcludedDomainEvent.EVENT_NAME,
      new MatchConcludedDomainEvent(concluded, tenantSchema),
    )

    return concluded
  }
}
