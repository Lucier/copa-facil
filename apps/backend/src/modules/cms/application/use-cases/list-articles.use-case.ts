import { Inject, Injectable } from '@nestjs/common'
import { ArticleEntity } from '../../domain/entities/article.entity'
import { IArticleRepository } from '../../domain/repositories/i-article.repository'
import { ARTICLE_REPOSITORY } from '../../domain/repositories/i-article.repository'

@Injectable()
export class ListArticlesUseCase {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly repo: IArticleRepository) {}

  execute(championshipId?: string, publishedOnly = false): Promise<ArticleEntity[]> {
    return publishedOnly
      ? this.repo.findPublished(championshipId)
      : this.repo.findAll(championshipId)
  }
}
