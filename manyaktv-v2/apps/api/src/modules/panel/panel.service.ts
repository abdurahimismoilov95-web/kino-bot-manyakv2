import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SubscriptionPlan } from '../subscription/entities/plan.entity';
import { PromoCode } from '../subscription/entities/promo-code.entity';
import { User } from '../users/entities/user.entity';

export const DEFAULT_SETTINGS = {
  botUsername: 'Manyaktvbot',
  channelUrl: '',
  adminContactUrl: '',
  webAppUrl: 'https://manyaktv-web1.onrender.com',
  cardNumber: '8600 0000 0000 0000',
  cardHolder: 'MANYAK TV',
};

export const DEFAULT_CATALOGS = [
  { id: 'cat_kino', title: 'Kinolar', isVisible: true, order: 0 },
  { id: 'cat_mini_drama', title: 'Mini dramalar', isVisible: true, order: 1 },
  { id: 'cat_anime', title: 'Anime', isVisible: true, order: 2 },
  { id: 'cat_drama', title: 'Seriallar', isVisible: true, order: 3 },
];

@Injectable()
export class PanelService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ---------- sozlamalar ----------
  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const row = await this.settingRepo.findOneBy({ key });
    return row ? (row.value as T) : fallback;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.settingRepo.save(this.settingRepo.create({ key, value }));
  }

  async getGeneral(): Promise<typeof DEFAULT_SETTINGS> {
    const saved = await this.getSetting<Record<string, unknown>>('general', {});
    return Object.assign({}, DEFAULT_SETTINGS, saved) as typeof DEFAULT_SETTINGS;
  }

  // ---------- audit ----------
  async log(actor: User | null, action: string, description?: string): Promise<void> {
    try {
      const row = this.auditRepo.create({
        actorId: actor ? actor.id : null,
        actorName: actor ? actor.firstName : null,
        action,
        description: description || null,
      });
      await this.auditRepo.save(row);
    } catch {
      /* audit xatosi asosiy amalni buzmasin */
    }
  }

  listAudit(): Promise<AuditLog[]> {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  // ---------- tariflar ----------
  private pickPlan(b: any): Partial<SubscriptionPlan> {
    const out: Partial<SubscriptionPlan> = {};
    if (!b) { return out; }
    if (b.name !== undefined) { out.name = String(b.name); }
    if (b.description !== undefined) { out.description = b.description ? String(b.description) : null; }
    if (b.price !== undefined) { out.price = Math.max(0, Math.round(Number(b.price) || 0)); }
    if (b.durationDays !== undefined) { out.durationDays = Math.max(1, Math.round(Number(b.durationDays) || 30)); }
    if (b.isActive !== undefined) { out.isActive = !!b.isActive; }
    if (b.isPopular !== undefined) { out.isPopular = !!b.isPopular; }
    if (b.badge !== undefined) { out.badge = b.badge ? String(b.badge) : null; }
    if (b.deviceLimit !== undefined) { out.deviceLimit = Math.max(1, Math.round(Number(b.deviceLimit) || 1)); }
    if (b.sortOrder !== undefined) { out.sortOrder = Math.round(Number(b.sortOrder) || 0); }
    return out;
  }

  async createPlan(body: any): Promise<SubscriptionPlan> {
    const data = Object.assign(
      { name: 'Yangi tarif', price: 0, durationDays: 30, isActive: true },
      this.pickPlan(body),
    );
    return this.planRepo.save(this.planRepo.create(data));
  }

  async updatePlan(id: string, body: any): Promise<SubscriptionPlan | null> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) { return null; }
    Object.assign(plan, this.pickPlan(body));
    return this.planRepo.save(plan);
  }

  async deactivatePlan(id: string): Promise<boolean> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) { return false; }
    plan.isActive = false;
    await this.planRepo.save(plan);
    return true;
  }

  async findPlan(id?: string): Promise<SubscriptionPlan | null> {
    if (!id) { return null; }
    try {
      return await this.planRepo.findOneBy({ id });
    } catch {
      return null;
    }
  }

  activePlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  // ---------- promokodlar ----------
  listPromos(): Promise<PromoCode[]> {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createPromo(body: any): Promise<PromoCode | null> {
    const code = String((body && body.code) || '').trim().toUpperCase();
    if (!code) { return null; }
    const exists = await this.promoRepo.findOneBy({ code });
    if (exists) { return null; }
    const pct = Math.min(100, Math.max(0, Math.round(Number(body.discountPercent) || 0)));
    const max = Math.round(Number(body.maxUses) || 0);
    return this.promoRepo.save(
      this.promoRepo.create({
        code,
        discountPercent: pct,
        maxUses: max > 0 ? max : null,
        isActive: true,
      }),
    );
  }

  async deletePromo(id: string): Promise<boolean> {
    const res = await this.promoRepo.delete({ id });
    return !!(res.affected && res.affected > 0);
  }

  async validatePromo(
    rawCode: string,
    planId?: string,
  ): Promise<{ valid: boolean; discountPercent: number; promoId?: string }> {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) { return { valid: false, discountPercent: 0 }; }
    const promo = await this.promoRepo.findOne({ where: { code, isActive: true } });
    if (!promo) { return { valid: false, discountPercent: 0 }; }
    if (promo.expiresAt && promo.expiresAt < new Date()) { return { valid: false, discountPercent: 0 }; }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) { return { valid: false, discountPercent: 0 }; }
    if (promo.planId && planId && promo.planId !== planId) { return { valid: false, discountPercent: 0 }; }
    return { valid: true, discountPercent: promo.discountPercent, promoId: promo.id };
  }

  async usePromo(promoId: string): Promise<void> {
    await this.promoRepo.increment({ id: promoId }, 'usedCount', 1);
  }

  // ---------- adminlar ----------
  listAdmins(): Promise<User[]> {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.role IN (:...roles)', { roles: ['admin', 'super_admin'] })
      .orderBy('u.created_at', 'ASC')
      .getMany();
  }

  findUser(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: [{ id }, { telegramId: id }] });
  }

  saveUser(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  newUser(data: Partial<User>): User {
    return this.userRepo.create(data);
  }
}
