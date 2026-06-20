import { Inject, Injectable } from '@nestjs/common'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'
import {
  CHAMPIONSHIP_REPOSITORY,
  IChampionshipRepository,
} from '../../domain/repositories/i-championship.repository'

@Injectable()
export class ListChampionshipsUseCase {
  constructor(
    @Inject(CHAMPIONSHIP_REPOSITORY)
    private readonly repo: IChampionshipRepository,
  ) {}

  execute(): Promise<ChampionshipEntity[]> {
    return this.repo.findAll()
  }
}
