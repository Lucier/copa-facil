import { BaseEntity } from '../../../../shared/domain/base-entity'

export class UserEntity extends BaseEntity {
  constructor(
    id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt)
  }
}
