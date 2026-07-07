import { Inject, Injectable } from '@nestjs/common'
import {
  ILedgerRepository,
  LedgerSummary} from '../../domain/repositories/i-ledger.repository'
import {
  LEDGER_REPOSITORY
} from '../../domain/repositories/i-ledger.repository'

@Injectable()
export class GetLedgerSummaryUseCase {
  constructor(@Inject(LEDGER_REPOSITORY) private readonly repo: ILedgerRepository) {}

  execute(championshipId: string): Promise<LedgerSummary[]> {
    return this.repo.getSummaryByChampionship(championshipId)
  }
}
