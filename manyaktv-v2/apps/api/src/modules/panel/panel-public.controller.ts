import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentService } from '../payment/payment.service';
import { ReceiptType } from '../payment/entities/receipt.entity';
import { PanelService } from './panel.service';

/** GET /api/v1/plans - faol tariflar (web shu manzilni chaqiradi) */
@Controller({ path: 'plans', version: '1' })
export class PlansAliasController {
  constructor(private readonly panel: PanelService) {}

  @Get()
  @Public()
  list() {
    return this.panel.activePlans();
  }
}

/** GET /api/v1/settings - ochiq sozlamalar (karta, havolalar) */
@Controller({ path: 'settings', version: '1' })
export class PublicSettingsController {
  constructor(private readonly panel: PanelService) {}

  @Get()
  @Public()
  get() {
    return this.panel.getGeneral();
  }
}

/** POST /api/v1/promo-codes/validate -> { valid, discountPercent } */
@Controller({ path: 'promo-codes', version: '1' })
export class PromoValidateController {
  constructor(private readonly panel: PanelService) {}

  @Post('validate')
  @Public()
  validate(@Body() body: { code?: string; planId?: string }) {
    return this.panel.validatePromo(String((body && body.code) || ''), body && body.planId);
  }
}

/** POST /api/v1/payments/receipt - web yuboradigan chek (summa serverda qayta hisoblanadi) */
@Controller({ path: 'payments', version: '1' })
export class ReceiptAliasController {
  constructor(
    private readonly panel: PanelService,
    private readonly payments: PaymentService,
  ) {}

  @Post('receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async submit(
    @CurrentUser() user: User,
    @Body()
    body: {
      planId?: string;
      amount?: number;
      promoCode?: string;
      receiptUrl?: string;
      notes?: string;
    },
  ) {
    const plan = await this.panel.findPlan(body && body.planId);

    let discountPercent = 0;
    let promoId: string | undefined;
    const code = String((body && body.promoCode) || '').trim();
    if (code) {
      const v = await this.panel.validatePromo(code, plan ? plan.id : undefined);
      if (v.valid) {
        discountPercent = v.discountPercent;
        promoId = v.promoId;
      }
    }

    const amount = plan
      ? Math.max(0, Math.round((plan.price * (100 - discountPercent)) / 100))
      : Math.max(0, Math.round(Number(body && body.amount) || 0));

    const dto: any = {
      type: ReceiptType.SUBSCRIPTION,
      imageUrl: String((body && body.receiptUrl) || ''),
      planId: plan ? plan.id : undefined,
      planName: plan ? plan.name : undefined,
      amount,
      promoCode: discountPercent > 0 ? code.toUpperCase() : undefined,
      discountPercent,
      notes: body && body.notes ? String(body.notes) : undefined,
    };

    const saved = await this.payments.submitReceipt(user.id, dto);
    if (promoId) { await this.panel.usePromo(promoId); }
    return saved;
  }
}
