import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { ArticleEntity } from '../../domain/entities/article.entity'
import { ArticleStatus } from '../../domain/enums'
import {
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from '../../domain/repositories/i-article.repository'

interface ArticleRow {
  id: string
  championship_id: string | null
  title: string
  slug: string
  content: string
  status: string
  category: string | null
  cover_image_url: string | null
  author_id: string
  published_at: Date | null
  created_at: Date
  updated_at: Date
}

function toEntity(r: ArticleRow): ArticleEntity {
  return new ArticleEntity(
    r.id, r.championship_id, r.title, r.slug, r.content,
    r.status as ArticleStatus, r.category, r.cover_image_url,
    r.author_id, r.published_at, r.created_at, r.updated_at,
  )
}

const COLS = `id, championship_id, title, slug, content, status, category,
              cover_image_url, author_id, published_at, created_at, updated_at`

@Injectable()
export class DrizzleArticleRepository implements IArticleRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<ArticleEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`SELECT ${tx(COLS.split(',').map((c) => c.trim()).filter(Boolean))} FROM articles WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`SELECT id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at FROM articles WHERE slug = ${slug} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findAll(championshipId?: string): Promise<ArticleEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      championshipId
        ? tx<ArticleRow[]>`SELECT id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at FROM articles WHERE championship_id = ${championshipId} ORDER BY created_at DESC`
        : tx<ArticleRow[]>`SELECT id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at FROM articles ORDER BY created_at DESC`,
    )
    return rows.map(toEntity)
  }

  async findPublished(championshipId?: string): Promise<ArticleEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      championshipId
        ? tx<ArticleRow[]>`SELECT id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at FROM articles WHERE status = 'published' AND championship_id = ${championshipId} ORDER BY published_at DESC`
        : tx<ArticleRow[]>`SELECT id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC`,
    )
    return rows.map(toEntity)
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`
        INSERT INTO articles (championship_id, title, slug, content, status, category, cover_image_url, author_id)
        VALUES (${data.championshipId ?? null}, ${data.title}, ${data.slug}, ${data.content}, 'draft', ${data.category ?? null}, ${data.coverImageUrl ?? null}, ${data.authorId})
        RETURNING id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async update(id: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`
        UPDATE articles SET
          title           = COALESCE(${data.title ?? null}, title),
          content         = COALESCE(${data.content ?? null}, content),
          category        = CASE WHEN ${data.category !== undefined} THEN ${data.category ?? null} ELSE category END,
          cover_image_url = CASE WHEN ${data.coverImageUrl !== undefined} THEN ${data.coverImageUrl ?? null} ELSE cover_image_url END,
          updated_at      = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async updateStatus(id: string, status: ArticleStatus, publishedAt?: Date | null): Promise<ArticleEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`
        UPDATE articles SET
          status       = ${status},
          published_at = CASE WHEN ${publishedAt !== undefined} THEN ${publishedAt instanceof Date ? publishedAt.toISOString() : null} ELSE published_at END,
          updated_at   = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, title, slug, content, status, category, cover_image_url, author_id, published_at, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) => tx`DELETE FROM articles WHERE id = ${id}`)
  }
}
