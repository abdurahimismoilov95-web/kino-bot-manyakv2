import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionPlan } from './entities/plan.entity';
import { PromoCode } from './entities/promo-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, PromoCode])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
