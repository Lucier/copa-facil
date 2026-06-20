import { Inject, Injectable } from '@nestjs/common'
import {
  ILedgerRepository,
  LEDGER_REPOSITORY,
  LedgerSummary,
} from '../../domain/repositories/i-ledger.repository'

@Injectable()
export class GetLedgerSummaryUseCase {
  constructor(@Inject(LEDGER_REPOSITORY) private readonly repo: ILedgerRepository) {}

  execute(championshipId: string): Promise<LedgerSummary[]> {
    return this.repo.getSummaryByChampionship(championshipId)
  }
}
