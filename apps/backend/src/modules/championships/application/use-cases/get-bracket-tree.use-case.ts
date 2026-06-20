import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  CHAMPIONSHIP_REPOSITORY,
  IChampionshipRepository,
} from '../../domain/repositories/i-championship.repository'
import {
  IRoundRepository,
  ROUND_REPOSITORY,
} from '../../domain/repositories/i-round.repository'
import { BracketOutputDto } from '../dtos/bracket-output.dto'
import { FixtureMapper } from '../mappers/fixture.mapper'

@Injectable()
export class GetBracketTreeUseCase {
  constructor(
    @Inject(CHAMPIONSHIP_REPOSITORY)
    private readonly championshipRepo: IChampionshipRepository,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepo: IRoundRepository,
  ) {}

  async execute(championshipId: string): Promise<BracketOutputDto> {
    const championship = await this.championshipRepo.findById(championshipId)
    if (!championship) throw new NotFoundException('Championship not found')

    const roundsWithMatches = await this.roundRepo.findWithMatchesByChampionshipId(
      championshipId,
    )

    return FixtureMapper.toBracketOutputDto(
      championshipId,
      championship.format,
      roundsWithMatches,
    )
  }
}
