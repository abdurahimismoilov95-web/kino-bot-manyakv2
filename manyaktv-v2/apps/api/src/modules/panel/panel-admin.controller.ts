import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly, SuperAdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { DEFAULT_CATALOGS, DEFAULT_SETTINGS, PanelService } from './panel.service';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@AdminOnly()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'admin', version: '1' })
export class PanelAdminController {
  constructor(private readonly panel: PanelService) {}

  // ----- Kataloglar -----
  @Get('catalogs')
  async getCatalogs() {
    const catalogs = await this.panel.getSetting<any[]>('catalogs', DEFAULT_CATALOGS);
    return { catalogs };
  }

  @Put('catalogs')
  async saveCatalogs(@Body() body: { catalogs?: any[] }, @CurrentUser() admin: User) {
    const list = Array.isArray(body && body.catalogs) ? (body.catalogs as any[]) : [];
    const clean = list.slice(0, 50).map((c: any, i: number) => ({
      id: String((c && c.id) || 'cat_' + i).slice(0, 64),
      title: String((c && c.title) || '').slice(0, 80),
      isVisible: c && c.isVisible !== false,
      order: i,
    }));
    await this.panel.setSetting('catalogs', clean);
    await this.panel.log(admin, 'catalogs.save', clean.length + ' ta katalog saqlandi');
    return { ok: true, catalogs: clean };
  }

  // ----- Tariflar -----
  @Post('plans')
  async createPlan(@Body() body: any, @CurrentUser() admin: User) {
    const plan = await this.panel.createPlan(body);
    await this.panel.log(admin, 'plan.create', plan.name);
    return plan;
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: any, @CurrentUser() admin: User) {
    const plan = await this.panel.updatePlan(id, body);
    if (!plan) { throw new NotFoundException('Tarif topilmadi'); }
    await this.panel.log(admin, 'plan.update', plan.name);
    return plan;
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string, @CurrentUser() admin: User) {
    const ok = await this.panel.deactivatePlan(id);
    if (!ok) { throw new NotFoundException('Tarif topilmadi'); }
    await this.panel.log(admin, 'plan.delete', id);
    return { ok: true };
  }

  // ----- Promokodlar -----
  @Get('promo-codes')
  listPromos() {
    return this.panel.listPromos();
  }

  @Post('promo-codes')
  async createPromo(@Body() body: any, @CurrentUser() admin: User) {
    const promo = await this.panel.createPromo(body);
    if (!promo) { throw new BadRequestException('Kod bosh yoki allaqachon mavjud'); }
    await this.panel.log(admin, 'promo.create', promo.code + ' (' + promo.discountPercent + '%)');
    return promo;
  }

  @Delete('promo-codes/:id')
  async deletePromo(@Param('id') id: string, @CurrentUser() admin: User) {
    const ok = await this.panel.deletePromo(id);
    if (!ok) { throw new NotFoundException('Promokod topilmadi'); }
    await this.panel.log(admin, 'promo.delete', id);
    return { ok: true };
  }

  // ----- Sozlamalar (ozgartirish faqat bosh admin) -----
  @Get('settings')
  getSettings() {
    return this.panel.getGeneral();
  }

  @SuperAdminOnly()
  @Put('settings')
  async saveSettings(@Body() body: Record<string, unknown>, @CurrentUser() admin: User) {
    const clean: Record<string, string> = {};
    Object.keys(DEFAULT_SETTINGS).forEach((k) => {
      const v = body ? body[k] : undefined;
      if (v !== undefined && v !== null) { clean[k] = String(v).trim().slice(0, 300); }
    });
    await this.panel.setSetting('general', clean);
    await this.panel.log(admin, 'settings.save', Object.keys(clean).join(', '));
    return this.panel.getGeneral();
  }

  // ----- Audit (faqat bosh admin) -----
  @SuperAdminOnly()
  @Get('audit-logs')
  auditLogs() {
    return this.panel.listAudit();
  }

  // ----- Adminlar (faqat bosh admin) -----
  @SuperAdminOnly()
  @Get('admins')
  admins() {
    return this.panel.listAdminsWithStats();
  }

  @SuperAdminOnly()
  @Get('admins/:id/logs')
  async adminLogs(@Param('id') id: string) {
    const user = await this.panel.findUser(id);
    if (!user) { throw new NotFoundException('Admin topilmadi'); }
    return this.panel.listAuditByActor(user.id);
  }

  @SuperAdminOnly()
  @Post('admins')
  async addAdmin(@Body() body: { telegramId?: string }, @CurrentUser() actor: User) {
    const id = String((body && body.telegramId) || '').trim();
    if (!/^[0-9]{3,20}$/.test(id)) {
      throw new BadRequestException('Telegram ID faqat raqamlardan iborat bolishi kerak');
    }
    let user = await this.panel.findUser(id);
    if (!user) {
      user = this.panel.newUser({
        id,
        telegramId: id,
        firstName: 'Admin',
        lastName: null,
        username: null,
        role: UserRole.ADMIN,
      });
    } else if (user.role === UserRole.USER) {
      user.role = UserRole.ADMIN;
    }
    const saved = await this.panel.saveUser(user);
    await this.panel.log(actor, 'admin.add', id);
    return saved;
  }

  @SuperAdminOnly()
  @Post('admins/:id/block')
  async blockAdmin(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() actor: User) {
    const user = await this.panel.findUser(id);
    if (!user) { throw new NotFoundException('Admin topilmadi'); }
    if (user.role === UserRole.SUPER_ADMIN || user.id === actor.id) {
      throw new ForbiddenException('Bosh adminni bloklab bolmaydi');
    }
    const reason = String((body && body.reason) || '').trim().slice(0, 300);
    user.isBanned = true;
    user.banReason = reason || 'Bosh admin tomonidan bloklandi';
    user.bannedAt = new Date();
    await this.panel.saveUser(user);
    await this.panel.log(actor, 'admin.block', user.telegramId + (reason ? ' - ' + reason : ''));
    return { ok: true };
  }

  @SuperAdminOnly()
  @Post('admins/:id/unblock')
  async unblockAdmin(@Param('id') id: string, @CurrentUser() actor: User) {
    const user = await this.panel.findUser(id);
    if (!user) { throw new NotFoundException('Admin topilmadi'); }
    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    await this.panel.saveUser(user);
    await this.panel.log(actor, 'admin.unblock', user.telegramId);
    return { ok: true };
  }

  @SuperAdminOnly()
  @Delete('admins/:id')
  async removeAdmin(@Param('id') id: string, @CurrentUser() actor: User) {
    const user = await this.panel.findUser(id);
    if (!user) { throw new NotFoundException('Foydalanuvchi topilmadi'); }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super adminni olib tashlab bolmaydi');
    }
    user.role = UserRole.USER;
    await this.panel.saveUser(user);
    await this.panel.log(actor, 'admin.remove', id);
    return { ok: true };
  }
}
