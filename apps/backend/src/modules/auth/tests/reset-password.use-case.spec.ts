import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case'
import { RedisTokenStoreService } from '../infrastructure/services/redis-token-store.service'
import { CryptService } from '../../../infrastructure/crypt/crypt.service'
import { MailService } from '../../../infrastructure/mail/mail.service'
import { USER_REPOSITORY } from '../domain/repositories/i-user.repository'
import { AUDIT_REPOSITORY } from '../domain/repositories/i-audit.repository'
import { UserEntity } from '../domain/entities/user.entity'

const MOCK_USER = new UserEntity('uid-1', 'u@u.com', 'User', 'hash', true, new Date(), new Date())

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase
  let userRepo: { findByEmail: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn>; updatePassword: ReturnType<typeof vi.fn> }
  let tokenStore: {
    storeResetToken: ReturnType<typeof vi.fn>
    getResetToken: ReturnType<typeof vi.fn>
    deleteResetToken: ReturnType<typeof vi.fn>
  }
  let crypt: { hash: ReturnType<typeof vi.fn> }
  let audit: { log: ReturnType<typeof vi.fn> }
  let mail: { sendPasswordReset: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    userRepo = {
      findByEmail: vi.fn().mockResolvedValue(MOCK_USER),
      findById: vi.fn(),
      updatePassword: vi.fn().mockResolvedValue(undefined),
    }
    tokenStore = {
      storeResetToken: vi.fn().mockResolvedValue(undefined),
      getResetToken: vi.fn().mockResolvedValue('uid-1'),
      deleteResetToken: vi.fn().mockResolvedValue(undefined),
    }
    crypt = { hash: vi.fn().mockResolvedValue('new-hash') }
    audit = { log: vi.fn().mockResolvedValue(undefined) }
    mail = { sendPasswordReset: vi.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: AUDIT_REPOSITORY, useValue: audit },
        { provide: RedisTokenStoreService, useValue: tokenStore },
        { provide: CryptService, useValue: crypt },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue('http://localhost:3000') },
        },
      ],
    }).compile()

    useCase = module.get<ResetPasswordUseCase>(ResetPasswordUseCase)
  })

  describe('requestReset', () => {
    it('stores reset token in Redis when user exists', async () => {
      await useCase.requestReset({ email: 'u@u.com' })
      expect(tokenStore.storeResetToken).toHaveBeenCalledOnce()
      const [token, userId] = tokenStore.storeResetToken.mock.calls[0]
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(30)
      expect(userId).toBe('uid-1')
    })

    it('sends a password reset email when user exists', async () => {
      await useCase.requestReset({ email: 'u@u.com' })
      expect(mail.sendPasswordReset).toHaveBeenCalledOnce()
      const [to, name, resetUrl] = mail.sendPasswordReset.mock.calls[0]
      expect(to).toBe('u@u.com')
      expect(name).toBe('User')
      expect(resetUrl).toContain('/auth/reset-password/confirm?token=')
    })

    it('still succeeds (no leak) when user does not exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null)
      await expect(useCase.requestReset({ email: 'nobody@x.com' })).resolves.not.toThrow()
      expect(tokenStore.storeResetToken).not.toHaveBeenCalled()
      expect(mail.sendPasswordReset).not.toHaveBeenCalled()
    })

    it('runs bcrypt dummy hash even when user is not found (constant time)', async () => {
      userRepo.findByEmail.mockResolvedValue(null)
      await useCase.requestReset({ email: 'nobody@x.com' })
      expect(crypt.hash).toHaveBeenCalledOnce()
    })
  })

  describe('confirmReset', () => {
    it('updates password hash and deletes reset token', async () => {
      await useCase.confirmReset({ token: 'reset-tok', newPassword: 'NewValidP@ss1' })
      expect(userRepo.updatePassword).toHaveBeenCalledWith('uid-1', 'new-hash')
      expect(tokenStore.deleteResetToken).toHaveBeenCalledWith('reset-tok')
    })

    it('throws BadRequestException when reset token does not exist or expired', async () => {
      tokenStore.getResetToken.mockResolvedValue(null)
      await expect(
        useCase.confirmReset({ token: 'expired-tok', newPassword: 'NewValidP@ss1' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws ValidationError when new password is too weak', async () => {
      await expect(
        useCase.confirmReset({ token: 'reset-tok', newPassword: 'weak' }),
      ).rejects.toThrow()
    })

    it('logs audit action after successful reset', async () => {
      await useCase.confirmReset({ token: 'reset-tok', newPassword: 'NewValidP@ss1' })
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.password_reset' }),
      )
    })
  })
})
