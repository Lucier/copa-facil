import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import request from 'supertest'
import { AuthController } from '../presentation/controllers/auth.controller'
import { LoginUseCase } from '../application/use-cases/login.use-case'
import { RegisterUseCase } from '../application/use-cases/register.use-case'
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case'
import { LogoutUseCase } from '../application/use-cases/logout.use-case'
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case'
import { JwtAuthGuard } from '../presentation/guards/jwt-auth.guard'

const TOKENS = { accessToken: 'acc.tok', refreshToken: 'ref.tok', expiresIn: 3600 }

const USER = { sub: 'u1', email: 'test@example.com', role: 'organizador', jti: 'jti-1' }

const mockLogin = { execute: vi.fn().mockResolvedValue(TOKENS) }
const mockRegister = { execute: vi.fn().mockResolvedValue(TOKENS) }
const mockRefresh = { execute: vi.fn().mockResolvedValue(TOKENS) }
const mockLogout = { execute: vi.fn().mockResolvedValue(undefined) }
const mockResetPassword = {
  requestReset: vi.fn().mockResolvedValue(undefined),
  confirmReset: vi.fn().mockResolvedValue(undefined),
}

const passGuard = { canActivate: (ctx: any) => {
  ctx.switchToHttp().getRequest().user = USER
  return true
}}

describe('AuthController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: mockLogin },
        { provide: RegisterUseCase, useValue: mockRegister },
        { provide: RefreshTokenUseCase, useValue: mockRefresh },
        { provide: LogoutUseCase, useValue: mockLogout },
        { provide: ResetPasswordUseCase, useValue: mockResetPassword },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(passGuard)
      .overrideGuard(AuthGuard('jwt')).useValue(passGuard)
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('POST /auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBe('acc.tok')
      expect(mockLogin.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      )
    })

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'pass' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'short' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/register', () => {
    it('returns 201 with tokens on valid registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'João Silva', email: 'joao@example.com', password: 'Password1!' })

      expect(res.status).toBe(201)
      expect(res.body.refreshToken).toBe('ref.tok')
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'a@b.com', password: 'Password1!' })

      expect(res.status).toBe(400)
    })

    it('passes organizationName + organizationSlug to use case when provided', async () => {
      mockRegister.execute.mockClear()
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Admin',
          email: 'admin@org.com',
          password: 'Password1!',
          organizationName: 'Liga Paulista',
          organizationSlug: 'liga-paulista',
        })

      expect(mockRegister.execute).toHaveBeenCalledWith(
        expect.objectContaining({ organizationName: 'Liga Paulista', organizationSlug: 'liga-paulista' }),
      )
    })
  })

  describe('POST /auth/refresh', () => {
    it('returns 200 with new token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'old-refresh-token' })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBe('acc.tok')
      expect(mockRefresh.execute).toHaveBeenCalledWith('old-refresh-token')
    })
  })

  describe('GET /auth/me', () => {
    it('returns user payload from JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(200)
      expect(res.body.sub).toBe('u1')
      expect(res.body.email).toBe('test@example.com')
    })
  })

  describe('POST /auth/logout', () => {
    it('returns 204 and calls logout use case', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(204)
      expect(mockLogout.execute).toHaveBeenCalledWith(USER)
    })
  })

  describe('POST /auth/reset-password/request', () => {
    it('returns 204 regardless of email existence', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password/request')
        .send({ email: 'any@example.com' })

      expect(res.status).toBe(204)
      expect(mockResetPassword.requestReset).toHaveBeenCalled()
    })
  })

  describe('POST /auth/reset-password/confirm', () => {
    it('returns 204 when token and new password are valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password/confirm')
        .send({ token: 'reset-tok', newPassword: 'NewPass1!' })

      expect(res.status).toBe(204)
      expect(mockResetPassword.confirmReset).toHaveBeenCalled()
    })
  })
})
