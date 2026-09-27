import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/plan.entity';
import { PromoCode } from './entities/promo-code.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
  ) {}

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findPlanById(id: string): Promise<SubscriptionPlan | null> {
    return this.planRepo.findOneBy({ id });
  }

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  async updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) throw new NotFoundException('Plan not found');
    Object.assign(plan, data);
    return this.planRepo.save(plan);
  }

  async validatePromoCode(
    code: string,
    planId?: string,
  ): Promise<{ discount: number; promoId: string } | null> {
    const promo = await this.promoRepo.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });
    if (!promo) return null;

    const now = new Date();
    if (promo.expiresAt && promo.expiresAt < now) return null;
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return null;
    if (promo.planId && planId && promo.planId !== planId) return null;

    return { discount: promo.discountPercent, promoId: promo.id };
  }

  async usePromoCode(promoId: string): Promise<void> {
    await this.promoRepo.increment({ id: promoId }, 'usedCount', 1);
  }

  async createPromoCode(data: Partial<PromoCode>): Promise<PromoCode> {
    const promo = this.promoRepo.create({
      ...data,
      code: data.code?.toUpperCase(),
    });
    return this.promoRepo.save(promo);
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }
}
