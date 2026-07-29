import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { LoginInputDto } from '../../application/dtos/login-input.dto'
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

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'

const isProd = () => process.env.NODE_ENV === 'production'

const ACCESS_COOKIE_OPTIONS = (ttlSeconds: number) => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: (isProd() ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: ttlSeconds * 1000,
  path: '/',
})

// Restrict refresh cookie to the refresh endpoint — minimises exposure
const REFRESH_COOKIE_OPTIONS = (ttlSeconds: number) => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: (isProd() ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: ttlSeconds * 1000,
  path: '/api/v1/auth/refresh',
})

function setTokenCookies(res: Response, tokens: TokenOutputDto): void {
  const raw = (tokens as TokenOutputDto & { _refreshToken?: string })._refreshToken
  res.cookie(ACCESS_COOKIE, tokens.accessToken, ACCESS_COOKIE_OPTIONS(tokens.expiresIn))
  if (raw) {
    res.cookie(REFRESH_COOKIE, raw, REFRESH_COOKIE_OPTIONS(tokens.refreshExpiresIn))
  }
}

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
    setTokenCookies(res, tokens)
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
    setTokenCookies(res, tokens)
    return tokens
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new token pair' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenOutputDto> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!refreshToken) throw new UnauthorizedException('Refresh token not found')
    const tokens = await this.refreshTokenUseCase.execute(refreshToken)
    setTokenCookies(res, tokens)
    return tokens
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return the authenticated user from the current session' })
  me(@CurrentUser() user: JwtPayload): Pick<JwtPayload, 'sub' | 'email' | 'role'> {
    return { sub: user.sub, email: user.email, role: user.role }
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
    res.clearCookie(ACCESS_COOKIE, { httpOnly: true, path: '/' })
    res.clearCookie(REFRESH_COOKIE, { httpOnly: true, path: '/api/v1/auth/refresh' })
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
