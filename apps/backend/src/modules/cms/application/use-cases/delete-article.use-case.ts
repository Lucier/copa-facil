import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { ARTICLE_REPOSITORY, IArticleRepository } from '../../domain/repositories/i-article.repository'

@Injectable()
export class DeleteArticleUseCase {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly repo: IArticleRepository) {}

  async execute(id: string): Promise<void> {
    const article = await this.repo.findById(id)
    if (!article) throw new NotFoundError('Article', id)
    await this.repo.delete(id)
  }
}
