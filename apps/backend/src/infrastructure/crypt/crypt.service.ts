import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class CryptService {
  private readonly rounds = 10

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.rounds)
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash)
  }
}
