import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SubscriptionPlan } from '../subscription/entities/plan.entity';
import { PromoCode } from '../subscription/entities/promo-code.entity';
import { User } from '../users/entities/user.entity';
import { PaymentModule } from '../payment/payment.module';
import { PanelService } from './panel.service';
import { PanelAdminController } from './panel-admin.controller';
import {
  PlansAliasController,
  PublicSettingsController,
  PromoValidateController,
  ReceiptAliasController,
} from './panel-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppSetting, AuditLog, SubscriptionPlan, PromoCode, User]),
    PaymentModule,
  ],
  controllers: [
    PanelAdminController,
    PlansAliasController,
    PublicSettingsController,
    PromoValidateController,
    ReceiptAliasController,
  ],
  providers: [PanelService],
  exports: [PanelService],
})
export class PanelModule {}
