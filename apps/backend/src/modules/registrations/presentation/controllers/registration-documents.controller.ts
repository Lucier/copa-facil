import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { ReviewDocumentDto } from '../../application/dtos/review-document.dto'
import { UploadDocumentDto } from '../../application/dtos/upload-document.dto'
import { ListDocumentsUseCase } from '../../application/use-cases/list-documents.use-case'
import { ReviewDocumentUseCase } from '../../application/use-cases/review-document.use-case'
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.use-case'

@ApiTags('Registrations — Documents')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('registrations/:registrationId/documents')
export class RegistrationDocumentsController {
  constructor(
    private readonly upload: UploadDocumentUseCase,
    private readonly list: ListDocumentsUseCase,
    private readonly review: ReviewDocumentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a compliance document for a registration' })
  create(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.upload.execute(registrationId, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for a registration' })
  listAll(@Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.list.execute(registrationId)
  }

  @Patch(':documentId/review')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review a document (approve/reject/set to em_analise)' })
  reviewOne(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.review.execute(documentId, dto, userId)
  }
}
