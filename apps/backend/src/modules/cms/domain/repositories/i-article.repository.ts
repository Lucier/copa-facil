import { ArticleStatus } from '../enums'
import { ArticleEntity } from '../entities/article.entity'

export interface CreateArticleData {
  championshipId?: string | null
  title: string
  slug: string
  content: string
  category?: string | null
  coverImageUrl?: string | null
  authorId: string
}

export interface UpdateArticleData {
  title?: string
  content?: string
  category?: string | null
  coverImageUrl?: string | null
}

export interface IArticleRepository {
  findById(id: string): Promise<ArticleEntity | null>
  findBySlug(slug: string): Promise<ArticleEntity | null>
  findAll(championshipId?: string): Promise<ArticleEntity[]>
  findPublished(championshipId?: string): Promise<ArticleEntity[]>
  create(data: CreateArticleData): Promise<ArticleEntity>
  update(id: string, data: UpdateArticleData): Promise<ArticleEntity>
  updateStatus(id: string, status: ArticleStatus, publishedAt?: Date | null): Promise<ArticleEntity>
  delete(id: string): Promise<void>
}

export const ARTICLE_REPOSITORY = 'ARTICLE_REPOSITORY'
