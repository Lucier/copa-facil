import { users } from '../../../../database/schemas/core.schema'
import { UserEntity } from '../../domain/entities/user.entity'
import { AuthUserDto } from '../dtos/token-output.dto'

type UserRow = typeof users.$inferSelect

export class UserMapper {
  static toDomain(row: UserRow): UserEntity {
    return new UserEntity(
      row.id,
      row.email,
      row.name,
      row.passwordHash,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    )
  }

  static toDto(entity: UserEntity): AuthUserDto {
    const dto = new AuthUserDto()
    dto.id = entity.id
    dto.email = entity.email
    dto.name = entity.name
    return dto
  }
}
