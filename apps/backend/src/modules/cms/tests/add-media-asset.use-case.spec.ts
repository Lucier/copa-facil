import { describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../../../shared/errors'
import { AddMediaAssetUseCase } from '../application/use-cases/add-media-asset.use-case'

describe('AddMediaAssetUseCase', () => {
  it('adds an asset to an existing gallery', async () => {
    const repo = {
      findById: vi.fn().mockResolvedValue({ id: 'g-1' }),
      addAsset: vi.fn().mockResolvedValue({ id: 'a-1' }),
    }
    const result = await new AddMediaAssetUseCase(repo as never).execute('g-1', {
      url: 'https://cdn/foto.jpg',
      description: 'Final',
      order: 1,
    } as never)
    expect(repo.addAsset).toHaveBeenCalledWith({
      galleryId: 'g-1',
      url: 'https://cdn/foto.jpg',
      description: 'Final',
      order: 1,
    })
    expect(result.id).toBe('a-1')
  })

  it('404 for unknown gallery', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null), addAsset: vi.fn() }
    await expect(new AddMediaAssetUseCase(repo as never).execute('x', {} as never)).rejects.toThrow(
      NotFoundError,
    )
  })
})
