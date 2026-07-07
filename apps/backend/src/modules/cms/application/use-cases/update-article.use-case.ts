import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { ArticleEntity } from '../../domain/entities/article.entity'
import { IArticleRepository } from '../../domain/repositories/i-article.repository'
import { ARTICLE_REPOSITORY } from '../../domain/repositories/i-article.repository'
import { UpdateArticleDto } from '../dtos/update-article.dto'

@Injectable()
export class UpdateArticleUseCase {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly repo: IArticleRepository) {}

  async execute(id: string, dto: UpdateArticleDto): Promise<ArticleEntity> {
    const article = await this.repo.findById(id)
    if (!article) throw new NotFoundError('Article', id)
    return this.repo.update(id, dto)
  }
}
