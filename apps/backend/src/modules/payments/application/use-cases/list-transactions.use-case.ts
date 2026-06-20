import { Inject, Injectable } from '@nestjs/common'
import { TransactionEntity } from '../../domain/entities/transaction.entity'
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../domain/repositories/i-transaction.repository'

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly repo: ITransactionRepository,
  ) {}

  execute(championshipId: string): Promise<TransactionEntity[]> {
    return this.repo.findByChampionshipId(championshipId)
  }
}
