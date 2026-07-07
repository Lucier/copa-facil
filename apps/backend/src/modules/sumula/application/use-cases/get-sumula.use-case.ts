import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { IMatchEventRepository} from '../../../match-engine/domain/repositories/i-match-event.repository'
import { MATCH_EVENT_REPOSITORY } from '../../../match-engine/domain/repositories/i-match-event.repository'
import { MatchEventEntity } from '../../../match-engine/domain/entities/match-event.entity'
import { ISumulaRepository} from '../../domain/repositories/i-sumula.repository'
import { SUMULA_REPOSITORY } from '../../domain/repositories/i-sumula.repository'
import { ILineupRepository} from '../../domain/repositories/i-lineup.repository'
import { LINEUP_REPOSITORY } from '../../domain/repositories/i-lineup.repository'
import { IOfficialRepository} from '../../domain/repositories/i-official.repository'
import { OFFICIAL_REPOSITORY } from '../../domain/repositories/i-official.repository'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { MatchLineupEntity } from '../../domain/entities/match-lineup.entity'
import { MatchOfficialEntity } from '../../domain/entities/match-official.entity'

export interface SumulaView {
  sumula: SumulaEntity
  lineup: MatchLineupEntity[]
  officials: MatchOfficialEntity[]
  events: MatchEventEntity[]
}

@Injectable()
export class GetSumulaUseCase {
  constructor(
    @Inject(SUMULA_REPOSITORY) private readonly sumulaRepo: ISumulaRepository,
    @Inject(LINEUP_REPOSITORY) private readonly lineupRepo: ILineupRepository,
    @Inject(OFFICIAL_REPOSITORY) private readonly officialRepo: IOfficialRepository,
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
  ) {}

  async execute(matchId: string): Promise<SumulaView> {
    const sumula = await this.sumulaRepo.findByMatchId(matchId)
    if (!sumula) throw new NotFoundError('Sumula', matchId)

    const [lineup, officials, events] = await Promise.all([
      this.lineupRepo.findByMatchId(matchId),
      this.officialRepo.findByMatchId(matchId),
      this.eventRepo.findByMatchId(matchId),
    ])

    return { sumula, lineup, officials, events }
  }
}
