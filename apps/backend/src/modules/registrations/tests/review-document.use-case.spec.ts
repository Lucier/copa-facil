import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ReviewDocumentUseCase } from '../application/use-cases/review-document.use-case'
import { REGISTRATION_DOCUMENT_REPOSITORY } from '../domain/repositories/i-registration-document.repository'
import { DocumentStatus } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const PENDING_DOC = { id: 'doc-1', status: DocumentStatus.PENDENTE, registrationId: 'r1' }
const APPROVED_DOC = { id: 'doc-1', status: DocumentStatus.APROVADO, registrationId: 'r1' }

describe('ReviewDocumentUseCase', () => {
  let useCase: ReviewDocumentUseCase
  let repo: { findById: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findById: vi.fn().mockResolvedValue(PENDING_DOC),
      updateStatus: vi.fn().mockResolvedValue(APPROVED_DOC),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewDocumentUseCase,
        { provide: REGISTRATION_DOCUMENT_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<ReviewDocumentUseCase>(ReviewDocumentUseCase)
  })

  it('approves document and updates status', async () => {
    const result = await useCase.execute('doc-1', { status: DocumentStatus.APROVADO }, 'reviewer-uid')
    expect(repo.updateStatus).toHaveBeenCalledWith('doc-1', DocumentStatus.APROVADO, 'reviewer-uid', null)
    expect(result.status).toBe(DocumentStatus.APROVADO)
  })

  it('rejects document with reason', async () => {
    repo.updateStatus.mockResolvedValue({ ...PENDING_DOC, status: DocumentStatus.REJEITADO })
    await useCase.execute('doc-1', { status: DocumentStatus.REJEITADO, rejectionReason: 'Documento ilegível' }, 'reviewer-uid')
    expect(repo.updateStatus).toHaveBeenCalledWith('doc-1', DocumentStatus.REJEITADO, 'reviewer-uid', 'Documento ilegível')
  })

  it('marks document as EM_ANALISE', async () => {
    repo.updateStatus.mockResolvedValue({ ...PENDING_DOC, status: DocumentStatus.EM_ANALISE })
    await useCase.execute('doc-1', { status: DocumentStatus.EM_ANALISE }, 'reviewer-uid')
    expect(repo.updateStatus).toHaveBeenCalledWith('doc-1', DocumentStatus.EM_ANALISE, 'reviewer-uid', null)
  })

  it('throws NotFoundError when document does not exist', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { status: DocumentStatus.APROVADO }, 'uid')).rejects.toThrow(NotFoundError)
  })
})
