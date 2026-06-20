import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetHealthUseCase } from '../application/get-health.use-case'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly getHealth: GetHealthUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  check() {
    return this.getHealth.execute()
  }
}
