import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Faol obuna rejalari' })
  getPlans() {
    return this.service.getActivePlans();
  }

  @Post('plans')
  @AdminOnly()
  createPlan(@Body() body: any) {
    return this.service.createPlan(body);
  }

  @Patch('plans/:id')
  @AdminOnly()
  updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.service.updatePlan(id, body);
  }

  @Post('validate-promo')
  @ApiOperation({ summary: 'Promo kod tekshirish' })
  validatePromo(@Body() body: { code: string; planId?: string }) {
    return this.service.validatePromoCode(body.code, body.planId);
  }

  @Get('promo-codes')
  @AdminOnly()
  getAllPromos() {
    return this.service.getAllPromoCodes();
  }

  @Post('promo-codes')
  @AdminOnly()
  createPromo(@Body() body: any) {
    return this.service.createPromoCode(body);
  }
}
