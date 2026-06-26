import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { CreateArticleUseCase } from '../application/use-cases/create-article.use-case'
import { ARTICLE_REPOSITORY } from '../domain/repositories/i-article.repository'
import { ArticleStatus } from '../domain/enums'
import { ConflictError } from '../../../shared/errors'

const MOCK_ARTICLE = { id: 'art-1', slug: 'meu-artigo', status: ArticleStatus.DRAFT, title: 'Meu Artigo', content: 'Conteúdo' }

describe('CreateArticleUseCase', () => {
  let useCase: CreateArticleUseCase
  let repo: { findBySlug: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findBySlug: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(MOCK_ARTICLE),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateArticleUseCase,
        { provide: ARTICLE_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<CreateArticleUseCase>(CreateArticleUseCase)
  })

  it('creates article when slug is unique', async () => {
    const result = await useCase.execute(
      { title: 'Meu Artigo', slug: 'meu-artigo', content: 'Conteúdo' },
      'author-uid',
    )
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'meu-artigo', authorId: 'author-uid' }),
    )
    expect(result.id).toBe('art-1')
  })

  it('throws ConflictError when slug already exists', async () => {
    repo.findBySlug.mockResolvedValue(MOCK_ARTICLE)
    await expect(
      useCase.execute({ title: 'Dup', slug: 'meu-artigo', content: 'x' }, 'author-uid'),
    ).rejects.toThrow(ConflictError)
  })

  it('passes optional fields (championshipId, category, coverImageUrl) to repository', async () => {
    await useCase.execute(
      { title: 'Art', slug: 'art', content: 'x', championshipId: 'c1', category: 'noticias', coverImageUrl: 'http://img.jpg' },
      'author-uid',
    )
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ championshipId: 'c1', category: 'noticias', coverImageUrl: 'http://img.jpg' }),
    )
  })

  it('defaults optional fields to null when not provided', async () => {
    await useCase.execute({ title: 'Art', slug: 'art', content: 'x' }, 'author-uid')
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ championshipId: null, category: null, coverImageUrl: null }),
    )
  })
})
