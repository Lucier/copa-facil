import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { REGISTRATION_DOCUMENT_REPOSITORY } from './domain/repositories/i-registration-document.repository'
import { REGISTRATION_REPOSITORY } from './domain/repositories/i-registration.repository'
import { ApproveTeamUseCase } from './application/use-cases/approve-team.use-case'
import { GetRegistrationUseCase } from './application/use-cases/get-registration.use-case'
import { ListDocumentsUseCase } from './application/use-cases/list-documents.use-case'
import { ListRegistrationsUseCase } from './application/use-cases/list-registrations.use-case'
import { RejectTeamUseCase } from './application/use-cases/reject-team.use-case'
import { ReviewDocumentUseCase } from './application/use-cases/review-document.use-case'
import { SubmitRegistrationUseCase } from './application/use-cases/submit-registration.use-case'
import { UploadDocumentUseCase } from './application/use-cases/upload-document.use-case'
import { DrizzleRegistrationDocumentRepository } from './infrastructure/repositories/drizzle-registration-document.repository'
import { DrizzleRegistrationRepository } from './infrastructure/repositories/drizzle-registration.repository'
import { RegistrationDocumentsController } from './presentation/controllers/registration-documents.controller'
import { RegistrationsController } from './presentation/controllers/registrations.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: REGISTRATION_REPOSITORY, useClass: DrizzleRegistrationRepository },
    { provide: REGISTRATION_DOCUMENT_REPOSITORY, useClass: DrizzleRegistrationDocumentRepository },
    SubmitRegistrationUseCase, ListRegistrationsUseCase, GetRegistrationUseCase,
    ApproveTeamUseCase, RejectTeamUseCase,
    UploadDocumentUseCase, ReviewDocumentUseCase, ListDocumentsUseCase,
  ],
  controllers: [RegistrationsController, RegistrationDocumentsController],
})
export class RegistrationsModule {}
