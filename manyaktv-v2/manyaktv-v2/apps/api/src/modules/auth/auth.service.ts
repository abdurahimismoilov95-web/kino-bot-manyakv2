import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { VerifyDto } from './dto/verify.dto';

export interface TelegramWebAppData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class AuthService {
  private readonly botToken: string;
  private readonly superAdminIds: Set<string>;
  private readonly additionalAdminIds: Set<string>;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.botToken = this.config.get<string>('telegram.botToken', '');
    const superAdminId = this.config.get<string>('telegram.superAdminId', '');
    this.superAdminIds = new Set(superAdminId ? [superAdminId] : []);
    const additionalIds = (this.config.get<string>('telegram.additionalAdminIds', '') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    this.additionalAdminIds = new Set(additionalIds);
  }

  // ════════════════════════════════════════════════════════════════
  //  Telegram WebApp initData ni tekshirish va JWT qaytarish
  // ════════════════════════════════════════════════════════════════
  async verifyTelegram(dto: VerifyDto): Promise<{ token: string; user: User }> {
    const userData = this.validateInitData(dto.initData);
    if (!userData) throw new UnauthorizedException('Invalid Telegram initData');

    const telegramId = String(userData.id);
    let user = await this.userRepo.findOne({ where: { telegramId } });

    if (!user) {
      // Yangi foydalanuvchi yaratish
      user = this.userRepo.create({
        id:         telegramId,
        telegramId: telegramId,
        firstName:  userData.first_name,
        lastName:   userData.last_name ?? null,
        username:   userData.username ?? null,
        avatarUrl:  userData.photo_url ?? null,
        role:       this.resolveRole(telegramId),
        lastSeenAt: new Date(),
      });
      user = await this.userRepo.save(user);
    } else {
      // Mavjud foydalanuvchini yangilash
      if (user.isBanned) throw new ForbiddenException('Your account is banned');
      user.firstName  = userData.first_name;
      user.lastName   = userData.last_name ?? null;
      user.username   = userData.username ?? null;
      user.lastSeenAt = new Date();
      user = await this.userRepo.save(user);
    }

    // HWID check (agar dto da bo'lsa)
    if (dto.hwid && user.hwid && user.hwid !== dto.hwid) {
      throw new ForbiddenException('Device mismatch — account locked to another device');
    }
    if (dto.hwid && !user.hwid) {
      user.hwid = dto.hwid;
      user = await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user };
  }

  // ─── Telegram initData HMAC-SHA256 tekshirish ───────────────────────────
  validateInitData(initData: string): TelegramWebAppData | null {
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) return null;

      params.delete('hash');

      // Telegram spetsifikatsiyasiga ko'ra saralash
      const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      // HMAC-SHA256 kaliti: "WebAppData" + botToken
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (expectedHash !== hash) return null;

      // auth_date muddati tekshirish (5 daqiqa)
      const authDate = parseInt(params.get('auth_date') || '0', 10);
      const age = Math.floor(Date.now() / 1000) - authDate;
      if (age > 300) return null; // 5 daqiqadan eski

      const userParam = params.get('user');
      if (!userParam) return null;

      return JSON.parse(decodeURIComponent(userParam)) as TelegramWebAppData;
    } catch {
      return null;
    }
  }

  private resolveRole(telegramId: string): UserRole {
    if (this.superAdminIds.has(telegramId)) return UserRole.SUPER_ADMIN;
    if (this.additionalAdminIds.has(telegramId)) return UserRole.ADMIN;
    return UserRole.USER;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  // ════════════════════════════════════════════════════════════════
  //  Admin brauzer orqali kirish (faqat admin/super_admin)
  // ════════════════════════════════════════════════════════════════
  /**
   * Telegram Mini App bo'lmagan brauzerdan kirish.
   * Faqat adminlar uchun: telegramId + ADMIN_BROWSER_SECRET.
   */
  async adminBrowserLogin(dto: { telegramId: string; secret: string }): Promise<{ token: string; user: User }> {
    // 1. Maxfiy kodni tekshirish
    const expectedSecret = this.config.get<string>('app.adminBrowserSecret', '');
    if (!expectedSecret || dto.secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Foydalanuvchini topish
    const user = await this.userRepo.findOne({ where: { telegramId: dto.telegramId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. Faqat admin/super_admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied: admin only');
    }

    // 4. Ban tekshiruvi
    if (user.isBanned) {
      throw new ForbiddenException('Account is banned');
    }

    // 5. JWT qaytarish
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user };
  }

}
