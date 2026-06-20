import { PartialType } from '@nestjs/swagger'
import { RegisterPlayerDto } from './register-player.dto'

export class UpdatePlayerDto extends PartialType(RegisterPlayerDto) {}
