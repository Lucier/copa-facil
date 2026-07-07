import { Inject, Injectable } from '@nestjs/common'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'
import {
  IChampionshipRepository} from '../../domain/repositories/i-championship.repository'
import {
  CHAMPIONSHIP_REPOSITORY
} from '../../domain/repositories/i-championship.repository'
import { CreateChampionshipDto } from '../dtos/create-championship.dto'

@Injectable()
export class CreateChampionshipUseCase {
  constructor(
    @Inject(CHAMPIONSHIP_REPOSITORY)
    private readonly repo: IChampionshipRepository,
  ) {}

  execute(dto: CreateChampionshipDto): Promise<ChampionshipEntity> {
    return this.repo.create({
      name: dto.name,
      season: dto.season,
      format: dto.format,
      legs: dto.legs,
      logoUrl: dto.logoUrl,
    })
  }
}
