import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { CreatePaymentOrderDto } from '../../application/dtos/create-payment-order.dto'
import { RefundTransactionDto } from '../../application/dtos/refund-transaction.dto'
import { CreatePaymentOrderUseCase } from '../../application/use-cases/create-payment-order.use-case'
import { GetLedgerSummaryUseCase } from '../../application/use-cases/get-ledger-summary.use-case'
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case'
import { RefundTransactionUseCase } from '../../application/use-cases/refund-transaction.use-case'

@ApiTags('Payments')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createOrder: CreatePaymentOrderUseCase,
    private readonly refund: RefundTransactionUseCase,
    private readonly listTx: ListTransactionsUseCase,
    private readonly ledger: GetLedgerSummaryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment order (PIX, Boleto, or Credit Card)' })
  create(@Body() dto: CreatePaymentOrderDto, @CurrentUser('sub') userId: string) {
    return this.createOrder.execute(dto, userId)
  }

  @Post(':id/refund')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a paid transaction (full or partial)' })
  refundOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundTransactionDto,
  ) {
    return this.refund.execute(id, dto)
  }

  @Get()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'List transactions for a championship' })
  @ApiQuery({ name: 'championshipId', required: true })
  listAll(@Query('championshipId') championshipId: string) {
    return this.listTx.execute(championshipId)
  }

  @Get('ledger/:championshipId')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Get ledger summary grouped by income category' })
  summary(@Param('championshipId', ParseUUIDPipe) championshipId: string) {
    return this.ledger.execute(championshipId)
  }
}
