import { Inject, Injectable } from '@nestjs/common'
import { PlayerStatisticEntity } from '../../domain/entities/player-statistic.entity'
import {
  IStatisticRepository} from '../../domain/repositories/i-statistic.repository'
import {
  STATISTIC_REPOSITORY,
} from '../../domain/repositories/i-statistic.repository'

@Injectable()
export class GetTopScorersUseCase {
  constructor(@Inject(STATISTIC_REPOSITORY) private readonly repo: IStatisticRepository) {}

  async execute(
    championshipId: string,
    orderBy: 'goals' | 'assists' | 'fair_play' = 'goals',
  ): Promise<PlayerStatisticEntity[]> {
    const stats = await this.repo.findByChampionshipId(championshipId)

    if (orderBy === 'goals') {
      return stats.filter((s) => s.goals > 0).sort((a, b) => b.goals - a.goals)
    }
    if (orderBy === 'assists') {
      return stats.filter((s) => s.assists > 0).sort((a, b) => b.assists - a.assists)
    }
    // fair_play: lower is better
    return stats
      .filter((s) => s.yellowCards > 0 || s.redCards > 0)
      .sort(
        (a, b) =>
          a.yellowCards * 1 + a.redCards * 3 - (b.yellowCards * 1 + b.redCards * 3),
      )
  }
}
