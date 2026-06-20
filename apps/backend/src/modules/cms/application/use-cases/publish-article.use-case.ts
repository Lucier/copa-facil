import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { ArticleEntity } from '../../domain/entities/article.entity'
import { ArticleStatus } from '../../domain/enums'
import { ARTICLE_REPOSITORY, IArticleRepository } from '../../domain/repositories/i-article.repository'

@Injectable()
export class PublishArticleUseCase {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly repo: IArticleRepository) {}

  async execute(id: string): Promise<ArticleEntity> {
    const article = await this.repo.findById(id)
    if (!article) throw new NotFoundError('Article', id)
    return this.repo.updateStatus(id, ArticleStatus.PUBLISHED, new Date())
  }

  async unpublish(id: string): Promise<ArticleEntity> {
    const article = await this.repo.findById(id)
    if (!article) throw new NotFoundError('Article', id)
    return this.repo.updateStatus(id, ArticleStatus.DRAFT, null)
  }
}
