import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '../../../../database/drizzle.service'
import { users } from '../../../../database/schemas/core.schema'
import { UserEntity } from '../../domain/entities/user.entity'
import {
  CreateUserData,
  IUserRepository,
} from '../../domain/repositories/i-user.repository'
import { UserMapper } from '../../application/mappers/user.mapper'

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return rows[0] ? UserMapper.toDomain(rows[0]) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    return rows[0] ? UserMapper.toDomain(rows[0]) : null
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const [row] = await this.drizzle.db
      .insert(users)
      .values({ name: data.name, email: data.email, passwordHash: data.passwordHash })
      .returning()
    return UserMapper.toDomain(row)
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.drizzle.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }
}
