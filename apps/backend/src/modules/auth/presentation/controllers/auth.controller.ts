import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
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
  login(@Body() dto: LoginInputDto): Promise<TokenOutputDto> {
    return this.loginUseCase.execute(dto)
  }

  @Post('register')
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and optionally create an organization' })
  register(@Body() dto: RegisterInputDto): Promise<TokenOutputDto> {
    return this.registerUseCase.execute(dto)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new token pair' })
  refresh(@Body() dto: RefreshTokenInputDto): Promise<TokenOutputDto> {
    return this.refreshTokenUseCase.execute(dto.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke current session tokens' })
  logout(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.logoutUseCase.execute(user)
  }

  @Post('reset-password/request')
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  requestReset(@Body() dto: ResetPasswordRequestDto): Promise<void> {
    return this.resetPasswordUseCase.requestReset(dto)
  }

  @Post('reset-password/confirm')
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm password reset with token' })
  confirmReset(@Body() dto: ResetPasswordConfirmDto): Promise<void> {
    return this.resetPasswordUseCase.confirmReset(dto)
  }
}
