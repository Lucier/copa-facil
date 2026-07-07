import { Inject, Injectable } from '@nestjs/common'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'
import {
  IChampionshipRepository} from '../../domain/repositories/i-championship.repository'
import {
  CHAMPIONSHIP_REPOSITORY
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
