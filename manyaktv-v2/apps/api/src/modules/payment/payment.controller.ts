import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService, CreateReceiptDto } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Payment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'payments', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('receipts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tolov cheki yuborish' })
  submitReceipt(@CurrentUser() user: User, @Body() dto: CreateReceiptDto) {
    return this.paymentService.submitReceipt(user.id, dto);
  }

  @Get('receipts/mine')
  getMyReceipts(@CurrentUser() user: User) {
    return this.paymentService.getUserReceipts(user.id);
  }

  @Get('receipts/pending')
  @AdminOnly()
  getPending(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.paymentService.getPendingReceipts(+page, +limit);
  }

  @Patch('receipts/:id/approve')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.paymentService.approveReceipt(id, admin.id);
  }

  @Patch('receipts/:id/reject')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() body: { reason: string },
  ) {
    return this.paymentService.rejectReceipt(id, admin.id, body.reason);
  }
}
