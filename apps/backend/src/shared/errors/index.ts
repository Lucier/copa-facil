import { AppError } from './app-error'

export { AppError, NotFoundError, UnauthorizedError } from './app-error'

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`, 'CONFLICT', 409)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}
