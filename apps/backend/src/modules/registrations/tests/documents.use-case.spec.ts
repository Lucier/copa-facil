import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../../../shared/errors'
import { ListDocumentsUseCase } from '../application/use-cases/list-documents.use-case'
import { UploadDocumentUseCase } from '../application/use-cases/upload-document.use-case'

let regRepo: { findById: ReturnType<typeof vi.fn> }
let docRepo: { create: ReturnType<typeof vi.fn>; findByRegistrationId: ReturnType<typeof vi.fn> }

beforeEach(() => {
  regRepo = { findById: vi.fn() }
  docRepo = { create: vi.fn(), findByRegistrationId: vi.fn() }
})

describe('UploadDocumentUseCase', () => {
  it('creates a document for an existing registration', async () => {
    regRepo.findById.mockResolvedValue({ id: 'reg-1' })
    docRepo.create.mockResolvedValue({ id: 'doc-1' })

    const result = await new UploadDocumentUseCase(regRepo as never, docRepo as never).execute('reg-1', {
      playerId: 'p-1',
      documentType: 'rg',
      fileUrl: 'https://cdn/doc.pdf',
    } as never)

    expect(docRepo.create).toHaveBeenCalledWith({
      registrationId: 'reg-1',
      playerId: 'p-1',
      documentType: 'rg',
      fileUrl: 'https://cdn/doc.pdf',
    })
    expect(result.id).toBe('doc-1')
  })

  it('defaults playerId to null', async () => {
    regRepo.findById.mockResolvedValue({ id: 'reg-1' })
    docRepo.create.mockResolvedValue({ id: 'doc-1' })
    await new UploadDocumentUseCase(regRepo as never, docRepo as never).execute('reg-1', {
      documentType: 'outros',
      fileUrl: 'https://cdn/doc.pdf',
    } as never)
    expect(docRepo.create).toHaveBeenCalledWith(expect.objectContaining({ playerId: null }))
  })

  it('404 for unknown registration', async () => {
    regRepo.findById.mockResolvedValue(null)
    await expect(
      new UploadDocumentUseCase(regRepo as never, docRepo as never).execute('x', {} as never),
    ).rejects.toThrow(NotFoundError)
  })
})

describe('ListDocumentsUseCase', () => {
  it('lists documents of a registration', async () => {
    regRepo.findById.mockResolvedValue({ id: 'reg-1' })
    docRepo.findByRegistrationId.mockResolvedValue([{ id: 'doc-1' }])
    const result = await new ListDocumentsUseCase(regRepo as never, docRepo as never).execute('reg-1')
    expect(result).toEqual([{ id: 'doc-1' }])
  })

  it('404 for unknown registration', async () => {
    regRepo.findById.mockResolvedValue(null)
    await expect(new ListDocumentsUseCase(regRepo as never, docRepo as never).execute('x')).rejects.toThrow(
      NotFoundError,
    )
  })
})
