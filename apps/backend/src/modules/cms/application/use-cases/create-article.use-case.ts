import { Inject, Injectable } from '@nestjs/common'
import { ConflictError } from '../../../../shared/errors'
import { ArticleEntity } from '../../domain/entities/article.entity'
import { ArticleStatus } from '../../domain/enums'
import { ARTICLE_REPOSITORY, IArticleRepository } from '../../domain/repositories/i-article.repository'
import { CreateArticleDto } from '../dtos/create-article.dto'

@Injectable()
export class CreateArticleUseCase {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly repo: IArticleRepository) {}

  async execute(dto: CreateArticleDto, authorId: string): Promise<ArticleEntity> {
    const existing = await this.repo.findBySlug(dto.slug)
    if (existing) throw new ConflictError('Article', 'slug')

    return this.repo.create({
      championshipId: dto.championshipId ?? null,
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      category: dto.category ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      authorId,
    })
  }
}
