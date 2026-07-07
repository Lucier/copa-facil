import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { PublishArticleUseCase } from '../application/use-cases/publish-article.use-case'
import { ARTICLE_REPOSITORY } from '../domain/repositories/i-article.repository'
import { ArticleStatus } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const DRAFT_ARTICLE = { id: 'art-1', slug: 'meu-artigo', status: ArticleStatus.DRAFT }
const PUBLISHED_ARTICLE = { ...DRAFT_ARTICLE, status: ArticleStatus.PUBLISHED, publishedAt: new Date() }

describe('PublishArticleUseCase', () => {
  let useCase: PublishArticleUseCase
  let repo: { findById: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findById: vi.fn().mockResolvedValue(DRAFT_ARTICLE),
      updateStatus: vi.fn().mockResolvedValue(PUBLISHED_ARTICLE),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishArticleUseCase,
        { provide: ARTICLE_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<PublishArticleUseCase>(PublishArticleUseCase)
  })

  describe('execute (publish)', () => {
    it('publishes draft article and sets publishedAt', async () => {
      const result = await useCase.execute('art-1')
      expect(repo.updateStatus).toHaveBeenCalledWith('art-1', ArticleStatus.PUBLISHED, expect.any(Date))
      expect(result.status).toBe(ArticleStatus.PUBLISHED)
    })

    it('throws NotFoundError when article does not exist', async () => {
      repo.findById.mockResolvedValue(null)
      await expect(useCase.execute('unknown')).rejects.toThrow(NotFoundError)
    })
  })

  describe('unpublish', () => {
    it('unpublishes article and clears publishedAt', async () => {
      repo.updateStatus.mockResolvedValue({ ...DRAFT_ARTICLE, status: ArticleStatus.DRAFT, publishedAt: null })
      const result = await useCase.unpublish('art-1')
      expect(repo.updateStatus).toHaveBeenCalledWith('art-1', ArticleStatus.DRAFT, null)
      expect(result.status).toBe(ArticleStatus.DRAFT)
    })

    it('throws NotFoundError when article does not exist', async () => {
      repo.findById.mockResolvedValue(null)
      await expect(useCase.unpublish('unknown')).rejects.toThrow(NotFoundError)
    })
  })
})
