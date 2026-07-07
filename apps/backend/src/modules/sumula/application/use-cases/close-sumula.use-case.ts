import { createHash } from 'crypto'
import { Inject, Injectable } from '@nestjs/common'
import { AppError } from '../../../../shared/errors/app-error'
import { NotFoundError } from '../../../../shared/errors'
import { MatchStatus } from '../../../championships/domain/enums'
import { IMatchRepository} from '../../../match-engine/domain/repositories/i-match.repository'
import { MATCH_REPOSITORY } from '../../../match-engine/domain/repositories/i-match.repository'
import { IMatchEventRepository} from '../../../match-engine/domain/repositories/i-match-event.repository'
import { MATCH_EVENT_REPOSITORY } from '../../../match-engine/domain/repositories/i-match-event.repository'
import { ISumulaRepository} from '../../domain/repositories/i-sumula.repository'
import { SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { ILineupRepository} from '../../domain/repositories/i-lineup.repository'
import { LINEUP_REPOSITORY } from '../../domain/repositories/i-lineup.repository'
import { IOfficialRepository} from '../../domain/repositories/i-official.repository'
import { OFFICIAL_REPOSITORY } from '../../domain/repositories/i-official.repository'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { SumulaStatus } from '../../domain/enums'

@Injectable()
export class CloseSumulaUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepo: IMatchRepository,
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(LINEUP_REPOSITORY) private readonly lineupRepo: ILineupRepository,
    @Inject(OFFICIAL_REPOSITORY) private readonly officialRepo: IOfficialRepository,
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
  ) {}

  async execute(matchId: string, closedBy: string): Promise<SumulaEntity> {
    const match = await this.matchRepo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)
    if (match.status !== MatchStatus.FINISHED) {
      throw new AppError('Match must be finished before closing the sumula', 'INVALID_STATE', 422)
    }

    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)
    if (sumula.isClosed()) throw new AppError('Sumula is already closed', 'INVALID_STATE', 422)

    const [lineup, officials, events] = await Promise.all([
      this.lineupRepo.findByMatchId(matchId),
      this.officialRepo.findByMatchId(matchId),
      this.eventRepo.findByMatchId(matchId),
    ])

    const payload = JSON.stringify({
      matchId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      observations: sumula.observations,
      lineup: lineup.map((l) => ({ playerId: l.playerId, teamId: l.teamId, isStarter: l.isStarter })),
      officials: officials.map((o) => ({ name: o.name, role: o.role })),
      events: events.map((e) => ({ eventType: e.eventType, minute: e.minute, teamId: e.teamId })),
    })

    const integrityHash = createHash('sha256').update(payload).digest('hex')

    return this.sumulaRepo.update(sumula.id, {
      status: SumulaStatus.FECHADA,
      closedAt: new Date(),
      closedBy,
      integrityHash,
    })
  }
}
