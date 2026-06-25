import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { CreateJudgeDto } from '../../application/dtos/create-judge.dto'
import { UpdateJudgeDto } from '../../application/dtos/update-judge.dto'
import { CreateJudgeUseCase } from '../../application/use-cases/create-judge.use-case'
import { ListJudgesUseCase } from '../../application/use-cases/list-judges.use-case'
import { GetJudgeUseCase } from '../../application/use-cases/get-judge.use-case'
import { UpdateJudgeUseCase } from '../../application/use-cases/update-judge.use-case'
import { DeleteJudgeUseCase } from '../../application/use-cases/delete-judge.use-case'
import { JudgeEntity } from '../../domain/entities/judge.entity'

@ApiTags('Judges')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('judges')
export class JudgesController {
  constructor(
    private readonly createJudge: CreateJudgeUseCase,
    private readonly listJudges: ListJudgesUseCase,
    private readonly getJudge: GetJudgeUseCase,
    private readonly updateJudge: UpdateJudgeUseCase,
    private readonly deleteJudge: DeleteJudgeUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new judge' })
  create(@Body() dto: CreateJudgeDto): Promise<JudgeEntity> {
    return this.createJudge.execute(dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all judges in the tenant' })
  list(): Promise<JudgeEntity[]> {
    return this.listJudges.execute()
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a judge by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<JudgeEntity> {
    return this.getJudge.execute(id)
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a judge' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJudgeDto,
  ): Promise<JudgeEntity> {
    return this.updateJudge.execute(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a judge' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteJudge.execute(id)
  }
}
