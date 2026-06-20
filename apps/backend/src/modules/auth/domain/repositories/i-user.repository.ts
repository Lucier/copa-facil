import { UserEntity } from '../entities/user.entity'

export const USER_REPOSITORY = 'IUserRepository'

export interface CreateUserData {
  name: string
  email: string
  passwordHash: string
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  create(data: CreateUserData): Promise<UserEntity>
  updatePassword(userId: string, passwordHash: string): Promise<void>
}
