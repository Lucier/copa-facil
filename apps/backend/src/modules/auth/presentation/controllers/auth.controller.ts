import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { LoginInputDto } from '../../application/dtos/login-input.dto'
import { RefreshTokenInputDto } from '../../application/dtos/refresh-token-input.dto'
import { RegisterInputDto } from '../../application/dtos/register-input.dto'
import { ResetPasswordConfirmDto } from '../../application/dtos/reset-password-confirm.dto'
import { ResetPasswordRequestDto } from '../../application/dtos/reset-password-request.dto'
import { TokenOutputDto } from '../../application/dtos/token-output.dto'
import { JwtPayload } from '../../application/jwt-payload.interface'
import { LoginUseCase } from '../../application/use-cases/login.use-case'
import { LogoutUseCase } from '../../application/use-cases/logout.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case'
import { RegisterUseCase } from '../../application/use-cases/register.use-case'
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case'
import { CurrentUser } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

const COOKIE_NAME = 'access_token'
const COOKIE_OPTIONS = (expiresInSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: expiresInSeconds * 1000,
  path: '/',
})

@ApiTags('Auth')
@ApiSecurity('x-tenant-id')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('login')
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(
    @Body() dto: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenOutputDto> {
    const tokens = await this.loginUseCase.execute(dto)
    res.cookie(COOKIE_NAME, tokens.accessToken, COOKIE_OPTIONS(tokens.expiresIn))
    return tokens
  }

  @Post('register')
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and optionally create an organization' })
  async register(
    @Body() dto: RegisterInputDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenOutputDto> {
    const tokens = await this.registerUseCase.execute(dto)
    res.cookie(COOKIE_NAME, tokens.accessToken, COOKIE_OPTIONS(tokens.expiresIn))
    return tokens
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new token pair' })
  async refresh(
    @Body() dto: RefreshTokenInputDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenOutputDto> {
    const tokens = await this.refreshTokenUseCase.execute(dto.refreshToken)
    res.cookie(COOKIE_NAME, tokens.accessToken, COOKIE_OPTIONS(tokens.expiresIn))
    return tokens
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return the authenticated user from the current session' })
  me(@CurrentUser() user: JwtPayload): Pick<JwtPayload, 'sub' | 'email' | 'role' | 'tenantSchema'> {
    return { sub: user.sub, email: user.email, role: user.role, tenantSchema: user.tenantSchema }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke current session tokens' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(user)
    res.clearCookie(COOKIE_NAME, { httpOnly: true, path: '/' })
  }

  @Post('reset-password/request')
  @Throttle({ global: { ttl: 300_000, limit: 3 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  requestReset(@Body() dto: ResetPasswordRequestDto): Promise<void> {
    return this.resetPasswordUseCase.requestReset(dto)
  }

  @Post('reset-password/confirm')
  @Throttle({ global: { ttl: 300_000, limit: 3 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm password reset with token' })
  confirmReset(@Body() dto: ResetPasswordConfirmDto): Promise<void> {
    return this.resetPasswordUseCase.confirmReset(dto)
  }
}
