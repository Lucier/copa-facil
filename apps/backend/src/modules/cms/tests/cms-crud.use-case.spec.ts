import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { GetArticleUseCase } from '../application/use-cases/get-article.use-case'
import { ListArticlesUseCase } from '../application/use-cases/list-articles.use-case'
import { DeleteArticleUseCase } from '../application/use-cases/delete-article.use-case'
import { UpdateArticleUseCase } from '../application/use-cases/update-article.use-case'
import { CreateGalleryUseCase } from '../application/use-cases/create-gallery.use-case'
import { ListGalleriesUseCase } from '../application/use-cases/list-galleries.use-case'
import { DeleteGalleryUseCase } from '../application/use-cases/delete-gallery.use-case'
import { CreateVideoUseCase } from '../application/use-cases/create-video.use-case'
import { ListVideosUseCase } from '../application/use-cases/list-videos.use-case'
import { ARTICLE_REPOSITORY } from '../domain/repositories/i-article.repository'
import { GALLERY_REPOSITORY } from '../domain/repositories/i-gallery.repository'
import { VIDEO_REPOSITORY } from '../domain/repositories/i-video.repository'
import { NotFoundError } from '../../../shared/errors'

const ARTICLE = { id: 'art-1', slug: 'noticia-1', status: 'draft', title: 'Notícia' }
const GALLERY = { id: 'gal-1', title: 'Fotos do jogo' }
const VIDEO = { id: 'vid-1', title: 'Gol bonito', url: 'http://yt.com/1' }

// ── Articles ─────────────────────────────────────────────────────────────────

describe('GetArticleUseCase', () => {
  const repo = () => ({ findById: vi.fn().mockResolvedValue(ARTICLE), findBySlug: vi.fn() })

  it('returns article by id', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [GetArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(GetArticleUseCase).execute('art-1')
    expect(result.id).toBe('art-1')
  })

  it('throws NotFoundError when article not found', async () => {
    const r = repo()
    r.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [GetArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await expect(mod.get(GetArticleUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('ListArticlesUseCase', () => {
  const repo = () => ({
    findAll: vi.fn().mockResolvedValue([ARTICLE]),
    findPublished: vi.fn().mockResolvedValue([ARTICLE]),
  })

  it('returns all articles when publishedOnly is false', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [ListArticlesUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await mod.get(ListArticlesUseCase).execute()
    expect(r.findAll).toHaveBeenCalledOnce()
  })

  it('returns only published articles when publishedOnly is true', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [ListArticlesUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await mod.get(ListArticlesUseCase).execute('c1', true)
    expect(r.findPublished).toHaveBeenCalledWith('c1')
  })
})

describe('DeleteArticleUseCase', () => {
  const repo = () => ({ findById: vi.fn().mockResolvedValue(ARTICLE), delete: vi.fn().mockResolvedValue(undefined) })

  it('deletes article when found', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [DeleteArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await mod.get(DeleteArticleUseCase).execute('art-1')
    expect(r.delete).toHaveBeenCalledWith('art-1')
  })

  it('throws NotFoundError when article not found', async () => {
    const r = repo()
    r.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [DeleteArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await expect(mod.get(DeleteArticleUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdateArticleUseCase', () => {
  const repo = () => ({
    findById: vi.fn().mockResolvedValue(ARTICLE),
    update: vi.fn().mockResolvedValue({ ...ARTICLE, title: 'Atualizado' }),
  })

  it('updates article when found', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [UpdateArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(UpdateArticleUseCase).execute('art-1', { title: 'Atualizado' })
    expect(result.title).toBe('Atualizado')
  })

  it('throws NotFoundError when article not found', async () => {
    const r = repo()
    r.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [UpdateArticleUseCase, { provide: ARTICLE_REPOSITORY, useValue: r }] }).compile()
    await expect(mod.get(UpdateArticleUseCase).execute('x', {})).rejects.toThrow(NotFoundError)
  })
})

// ── Galleries ────────────────────────────────────────────────────────────────

describe('CreateGalleryUseCase', () => {
  const repo = () => ({ create: vi.fn().mockResolvedValue(GALLERY) })

  it('creates gallery', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [CreateGalleryUseCase, { provide: GALLERY_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(CreateGalleryUseCase).execute({ title: 'Fotos do jogo' })
    expect(r.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('gal-1')
  })
})

describe('ListGalleriesUseCase', () => {
  const repo = () => ({ findAll: vi.fn().mockResolvedValue([GALLERY]) })

  it('returns all galleries', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [ListGalleriesUseCase, { provide: GALLERY_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(ListGalleriesUseCase).execute()
    expect(result).toHaveLength(1)
  })
})

describe('DeleteGalleryUseCase', () => {
  const repo = () => ({
    findById: vi.fn().mockResolvedValue(GALLERY),
    delete: vi.fn().mockResolvedValue(undefined),
  })

  it('deletes gallery when found', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [DeleteGalleryUseCase, { provide: GALLERY_REPOSITORY, useValue: r }] }).compile()
    await mod.get(DeleteGalleryUseCase).execute('gal-1')
    expect(r.delete).toHaveBeenCalledWith('gal-1')
  })

  it('throws NotFoundError when gallery not found', async () => {
    const r = repo()
    r.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [DeleteGalleryUseCase, { provide: GALLERY_REPOSITORY, useValue: r }] }).compile()
    await expect(mod.get(DeleteGalleryUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

// ── Videos ───────────────────────────────────────────────────────────────────

describe('CreateVideoUseCase', () => {
  const repo = () => ({ create: vi.fn().mockResolvedValue(VIDEO) })

  it('creates video', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [CreateVideoUseCase, { provide: VIDEO_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(CreateVideoUseCase).execute({ title: 'Gol bonito', provider: 'youtube' as any, embedId: 'abc123', embedUrl: 'https://yt.be/abc123' })
    expect(r.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('vid-1')
  })
})

describe('ListVideosUseCase', () => {
  const repo = () => ({ findAll: vi.fn().mockResolvedValue([VIDEO]) })

  it('returns all videos', async () => {
    const r = repo()
    const mod = await Test.createTestingModule({ providers: [ListVideosUseCase, { provide: VIDEO_REPOSITORY, useValue: r }] }).compile()
    const result = await mod.get(ListVideosUseCase).execute()
    expect(result).toHaveLength(1)
  })
})
